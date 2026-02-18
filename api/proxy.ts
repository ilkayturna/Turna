process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

interface ProxyRequest {
  serviceUrl: string;
  serviceMethod: string;
  serviceHeaders?: Record<string, unknown>;
  body?: unknown;
}

const CHROME_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36";

const BLOCKED_HEADERS = new Set([
  "host",
  "connection",
  "content-length",
  "transfer-encoding",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "upgrade",
]);

const firstHeader = (value: unknown): string | undefined => {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return undefined;
};

const parseProxyBody = (raw: unknown): Partial<ProxyRequest> => {
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

const normalizeHeaders = (input: unknown): Record<string, string> => {
  const out: Record<string, string> = {};
  if (!input || typeof input !== "object") return out;

  for (const [rawKey, rawValue] of Object.entries(input as Record<string, unknown>)) {
    const key = rawKey.toLowerCase().trim();
    if (!key || BLOCKED_HEADERS.has(key)) continue;

    if (typeof rawValue === "string") out[key] = rawValue;
    else if (typeof rawValue === "number" || typeof rawValue === "boolean") out[key] = String(rawValue);
  }

  return out;
};

export default async function handler(req: any, res: any) {
  try {
    const requestOrigin = firstHeader(req.headers?.origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Origin", requestOrigin || "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader(
      "Access-Control-Allow-Headers",
      firstHeader(req.headers?.["access-control-request-headers"]) || "Content-Type, Authorization"
    );

    if (req.method === "OPTIONS") {
      return res.status(204).end();
    }

    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const payload = parseProxyBody(req.body);
    const serviceUrl = typeof payload.serviceUrl === "string" ? payload.serviceUrl.trim() : "";
    const serviceMethod = typeof payload.serviceMethod === "string" ? payload.serviceMethod.toUpperCase().trim() : "";

    if (!serviceUrl || !serviceMethod) {
      return res.status(400).json({ error: "Missing serviceUrl or serviceMethod" });
    }

    let target: URL;
    try {
      target = new URL(serviceUrl);
    } catch {
      return res.status(400).json({ error: "Invalid serviceUrl" });
    }

    const headers = normalizeHeaders(payload.serviceHeaders);
    delete headers.host;

    headers["user-agent"] = CHROME_UA;
    headers["origin"] = target.origin;
    headers["referer"] = `${target.origin}/`;

    let upstreamBody: string | undefined;
    if (payload.body !== undefined && payload.body !== null && serviceMethod !== "GET" && serviceMethod !== "HEAD") {
      upstreamBody = typeof payload.body === "string" ? payload.body : JSON.stringify(payload.body);
      headers["content-type"] = "application/json";
    } else {
      delete headers["content-type"];
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    let upstreamResponse: Response;
    try {
      upstreamResponse = await fetch(target.toString(), {
        method: serviceMethod,
        headers,
        body: upstreamBody,
        redirect: "follow",
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    const rawText = await upstreamResponse.text();
    const contentType = upstreamResponse.headers.get("content-type") || "text/plain; charset=utf-8";
    res.setHeader("Content-Type", contentType);

    return res.status(upstreamResponse.status).send(rawText);
  } catch (error: any) {
    return res.status(500).json({
      error: String(error?.message || error || "Unknown proxy error"),
    });
  }
}
