interface ProxyRequest {
  serviceUrl: string;
  serviceMethod: string;
  serviceHeaders?: Record<string, unknown>;
  body?: unknown;
}

const ALLOWED_METHODS = new Set([
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "HEAD",
  "OPTIONS",
]);

const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "host",
  "content-length",
]);

const RESPONSE_HEADERS_TO_FORWARD = [
  "content-type",
  "cache-control",
  "etag",
  "last-modified",
  "content-disposition",
  "retry-after",
];

const RETRY_DELAY_MS = 1000;
const RETRY_COUNT = 1;
const DEFAULT_TIMEOUT_MS = 15000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getHeader = (headers: any, key: string): string | undefined => {
  const value = headers?.[key] ?? headers?.[key.toLowerCase()];
  if (Array.isArray(value)) return value[0];
  return typeof value === "string" ? value : undefined;
};

const parseCsv = (value: string | undefined): string[] =>
  (value ?? "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);

const getAllowedOrigins = (): string[] => {
  return parseCsv(process.env.CORS_ALLOWED_ORIGINS || process.env.CORS_ALLOWLIST);
};

const isOriginAllowed = (origin: string | undefined, req: any): boolean => {
  if (!origin) return true;

  const configured = getAllowedOrigins();
  if (configured.length > 0) {
    return configured.includes(origin);
  }

  // strict fallback: same-host only when no env allowlist is set
  const reqHost = getHeader(req.headers, "host");
  if (!reqHost) return false;

  try {
    return new URL(origin).host === reqHost;
  } catch {
    return false;
  }
};

const setCorsHeaders = (res: any, origin: string | undefined, req: any): void => {
  const requestHeaders =
    getHeader(req.headers, "access-control-request-headers") ||
    "content-type, authorization";

  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", requestHeaders);
  res.setHeader("Access-Control-Max-Age", "600");

  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
};

const parseBody = (raw: unknown): Partial<ProxyRequest> => {
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

const headerValueToString = (value: unknown): string | undefined => {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    const parts = value
      .map((v) =>
        typeof v === "string" || typeof v === "number" || typeof v === "boolean"
          ? String(v)
          : ""
      )
      .filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : undefined;
  }
  return undefined;
};

const sanitizeHeaders = (input: unknown): Record<string, string> => {
  const output: Record<string, string> = {};
  if (!input || typeof input !== "object") return output;

  for (const [rawKey, rawValue] of Object.entries(input as Record<string, unknown>)) {
    const key = rawKey.toLowerCase().trim();
    if (!key || HOP_BY_HOP_HEADERS.has(key)) continue;

    const value = headerValueToString(rawValue);
    if (!value) continue;

    output[key] = value;
  }

  if (!output.accept) {
    output.accept = "application/json, text/plain;q=0.9, */*;q=0.8";
  }

  if (!output["user-agent"]) {
    output["user-agent"] = "VercelProxy/1.0";
  }

  return output;
};

const buildUpstreamBody = (
  method: string,
  body: unknown,
  headers: Record<string, string>
): BodyInit | undefined => {
  if (method === "GET" || method === "HEAD") return undefined;
  if (body === undefined || body === null) return undefined;

  if (typeof body === "string") {
    if (!headers["content-type"]) {
      headers["content-type"] = "text/plain; charset=utf-8";
    }
    return body;
  }

  if (body instanceof Uint8Array || body instanceof ArrayBuffer) {
    if (!headers["content-type"]) {
      headers["content-type"] = "application/octet-stream";
    }
    return body as BodyInit;
  }

  if (!headers["content-type"]) {
    headers["content-type"] = "application/json";
  }
  return JSON.stringify(body);
};

const forwardResponseHeaders = (upstream: Response, res: any): void => {
  for (const name of RESPONSE_HEADERS_TO_FORWARD) {
    const value = upstream.headers.get(name);
    if (value) res.setHeader(name, value);
  }
};

export default async function handler(req: any, res: any) {
  try {
    const origin = getHeader(req.headers, "origin");
    const originAllowed = isOriginAllowed(origin, req);

    if (origin && !originAllowed) {
      return res.status(403).json({ error: "CORS origin not allowed" });
    }

    setCorsHeaders(res, origin, req);

    if (req.method === "OPTIONS") {
      return res.status(204).end();
    }

    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const payload = parseBody(req.body);
    const serviceUrl =
      typeof payload.serviceUrl === "string" ? payload.serviceUrl.trim() : "";
    const serviceMethod =
      typeof payload.serviceMethod === "string"
        ? payload.serviceMethod.toUpperCase().trim()
        : "";

    if (!serviceUrl) {
      return res.status(400).json({ error: "Missing serviceUrl" });
    }

    if (!ALLOWED_METHODS.has(serviceMethod)) {
      return res.status(400).json({ error: "Invalid serviceMethod" });
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

    const upstreamHeaders = sanitizeHeaders(payload.serviceHeaders);
    const upstreamBody = buildUpstreamBody(serviceMethod, payload.body, upstreamHeaders);

    const timeoutMs = Number(process.env.PROXY_TIMEOUT_MS || DEFAULT_TIMEOUT_MS);

    let upstream: Response | null = null;
    let lastError: unknown = null;

    for (let attempt = 0; attempt <= RETRY_COUNT; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      try {
        upstream = await fetch(target.toString(), {
          method: serviceMethod,
          headers: upstreamHeaders,
          body: upstreamBody,
          redirect: "follow",
          signal: controller.signal,
        });

        if (upstream.status >= 500 && attempt < RETRY_COUNT) {
          await sleep(RETRY_DELAY_MS);
          continue;
        }

        break;
      } catch (err) {
        lastError = err;
        if (attempt < RETRY_COUNT) {
          await sleep(RETRY_DELAY_MS);
          continue;
        }
      } finally {
        clearTimeout(timer);
      }
    }

    if (!upstream) {
      const details =
        lastError instanceof Error ? lastError.message : "Unknown upstream error";
      return res.status(502).json({
        error: "Upstream connection failed",
        details,
      });
    }

    forwardResponseHeaders(upstream, res);

    const data = Buffer.from(await upstream.arrayBuffer());
    return res.status(upstream.status).send(data);
  } catch (err: any) {
    return res.status(500).json({
      error: "Proxy execution error",
      message: err?.message || "Unknown error",
    });
  }
}
