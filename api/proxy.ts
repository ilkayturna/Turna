type ProxyRequest = {
  serviceUrl: string;
  serviceMethod: string;
  body?: unknown;
  serviceHeaders?: Record<string, unknown>;
};

const HOP_BY_HOP_HEADERS = new Set([
  "host",
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "content-length",
]);

const CHROME_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

const parseCsv = (value?: string): string[] =>
  (value || "")
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);

const getAllowedHosts = (): string[] => parseCsv(process.env.PROXY_ALLOWLIST);
const getAllowedOrigins = (): string[] => parseCsv(process.env.CORS_ALLOWED_ORIGINS);

const parseIncomingBody = (raw: unknown): Partial<ProxyRequest> => {
  if (!raw) return {};
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as Partial<ProxyRequest>;
    } catch {
      return {};
    }
  }
  if (typeof raw === "object") return raw as Partial<ProxyRequest>;
  return {};
};

const sanitizeHeaders = (headers?: Record<string, unknown>): Record<string, string> => {
  const out: Record<string, string> = {};
  if (!headers) return out;

  for (const [k, v] of Object.entries(headers)) {
    const key = k.toLowerCase().trim();
    if (!key || HOP_BY_HOP_HEADERS.has(key)) continue;
    if (typeof v === "string") out[key] = v;
    else if (typeof v === "number" || typeof v === "boolean") out[key] = String(v);
    else if (Array.isArray(v)) out[key] = v.map(String).join(", ");
  }

  return out;
};

const buildUpstreamBody = (
  method: string,
  input: unknown,
  headers: Record<string, string>
): BodyInit | undefined => {
  if (method === "GET" || method === "HEAD") return undefined;
  if (input === undefined || input === null) return undefined;

  if (typeof input === "string") {
    if (!headers["content-type"]) headers["content-type"] = "text/plain; charset=utf-8";
    return input;
  }

  if (!headers["content-type"]) headers["content-type"] = "application/json";
  return JSON.stringify(input);
};

const setCors = (req: any, res: any): boolean => {
  const origin = typeof req.headers?.origin === "string" ? req.headers.origin : "";
  const allowlist = getAllowedOrigins();

  if (!origin) {
    res.setHeader("Access-Control-Allow-Origin", "*");
  } else if (allowlist.length === 0 || allowlist.includes(origin.toLowerCase())) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  } else {
    return false;
  }

  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    typeof req.headers?.["access-control-request-headers"] === "string"
      ? req.headers["access-control-request-headers"]
      : "Content-Type, Authorization"
  );
  res.setHeader("Access-Control-Max-Age", "600");
  return true;
};

export default async function handler(req: any, res: any) {
  if (!setCors(req, res)) {
    return res.status(403).json({ error: "CORS origin not allowed" });
  }

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const payload = parseIncomingBody(req.body);
    const serviceUrl = typeof payload.serviceUrl === "string" ? payload.serviceUrl.trim() : "";
    const serviceMethod =
      typeof payload.serviceMethod === "string" ? payload.serviceMethod.toUpperCase().trim() : "";

    if (!serviceUrl || !serviceMethod) {
      return res.status(400).json({ error: "Missing serviceUrl or serviceMethod" });
    }

    let target: URL;
    try {
      target = new URL(serviceUrl);
    } catch {
      return res.status(400).json({ error: "Invalid serviceUrl" });
    }

    if (target.protocol !== "https:") {
      return res.status(400).json({ error: "Only https URLs are allowed" });
    }

    const allowedHosts = getAllowedHosts();
    if (allowedHosts.length > 0 && !allowedHosts.includes(target.hostname.toLowerCase())) {
      return res.status(403).json({ error: "Target host is not allowlisted" });
    }

    const headers = sanitizeHeaders(payload.serviceHeaders);
    delete headers.host;

    if (!headers["user-agent"]) headers["user-agent"] = CHROME_UA;
    if (!headers.origin) headers.origin = target.origin;
    if (!headers.referer) headers.referer = `${target.origin}/`;

    const upstreamBody = buildUpstreamBody(serviceMethod, payload.body, headers);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);

    let upstream: Response;
    try {
      upstream = await fetch(target.toString(), {
        method: serviceMethod,
        headers,
        body: upstreamBody,
        redirect: "follow",
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    const responseText = await upstream.text();
    const contentType = upstream.headers.get("content-type");
    if (contentType) res.setHeader("Content-Type", contentType);

    return res.status(upstream.status).send(responseText);
  } catch (error: any) {
    return res.status(500).json({
      error: "Proxy execution error",
      message: error?.message || "Unknown error",
    });
  }
}
