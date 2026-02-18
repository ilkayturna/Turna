import type { VercelRequest, VercelResponse } from "@vercel/node";

type ProxyRequest = {
  serviceId?: string;
  serviceUrl?: string;
  serviceMethod?: string;
  serviceHeaders?: Record<string, unknown>;
  body?: unknown;
  targetPhone?: string;
  phone?: string;
};

type UpstreamFailure = {
  status: number;
  text: string;
  contentType?: string;
  attempt: number;
};

const PHONE_KEYS = [
  "phone",
  "mobile",
  "gsm",
  "msisdn",
  "phoneNumber",
  "PhoneNumber",
  "mobilePhoneNumber",
];

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

const DEFAULT_TIMEOUT_MS = 15000;

const parseCsv = (value?: string): string[] =>
  (value || "")
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);

const parseBody = (raw: unknown): ProxyRequest => {
  if (!raw) return {};
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as ProxyRequest;
    } catch {
      return {};
    }
  }
  if (typeof raw === "object") return raw as ProxyRequest;
  return {};
};

const cloneSafe = <T>(value: T): T => {
  try {
    return JSON.parse(JSON.stringify(value)) as T;
  } catch {
    return value;
  }
};

const digitsOnly = (value: string): string => value.replace(/\D/g, "");

const toRawPhone = (value: string): string => {
  const d = digitsOnly(value);
  if (d.length === 10) return d;
  if (d.length === 11 && d.startsWith("0")) return d.slice(1);
  if (d.length === 12 && d.startsWith("90")) return d.slice(2);
  return d;
};

const toIntlPhone = (value: string): string => {
  const raw = toRawPhone(value);
  if (raw.length === 10) return `90${raw}`;
  const d = digitsOnly(value);
  if (d.startsWith("90")) return d;
  return raw ? `90${raw}` : "";
};

const findPhone = (input: ProxyRequest): string => {
  if (typeof input.targetPhone === "string" && input.targetPhone.trim()) return input.targetPhone.trim();
  if (typeof input.phone === "string" && input.phone.trim()) return input.phone.trim();

  if (input.body && typeof input.body === "object" && !Array.isArray(input.body)) {
    const obj = input.body as Record<string, unknown>;
    for (const key of PHONE_KEYS) {
      if (typeof obj[key] === "string" && (obj[key] as string).trim()) {
        return (obj[key] as string).trim();
      }
    }
  }

  return "";
};

const patchPhoneFields = (base: unknown, phoneValue: string): unknown => {
  if (!phoneValue) return base;

  if (base && typeof base === "object" && !Array.isArray(base)) {
    const out = cloneSafe(base as Record<string, unknown>);
    let patched = false;

    for (const key of PHONE_KEYS) {
      if (Object.prototype.hasOwnProperty.call(out, key)) {
        out[key] = phoneValue;
        patched = true;
      }
    }

    if (out.variables && typeof out.variables === "object" && !Array.isArray(out.variables)) {
      const vars = out.variables as Record<string, unknown>;
      for (const key of PHONE_KEYS) {
        if (Object.prototype.hasOwnProperty.call(vars, key)) {
          vars[key] = phoneValue;
          patched = true;
        }
      }
      out.variables = vars;
    }

    if (!patched) out.phone = phoneValue;
    return out;
  }

  if (typeof base === "string") return base;
  return { phone: phoneValue };
};

const buildSpecialPayload = (
  serviceId: string,
  originalBody: unknown,
  rawPhone: string,
  intlPhone: string
): unknown => {
  const key = serviceId.toLowerCase();

  switch (key) {
    case "lc_waikiki":
      return { PhoneNumber: rawPhone };
    case "english_home":
      return { Phone: rawPhone, Source: "WEB" };
    case "file_market":
      return { mobilePhoneNumber: intlPhone };
    case "tikla_gelsin":
      return {
        operationName: "GENERATE_OTP",
        query:
          "mutation GENERATE_OTP($phone: String!) { generateOtp(phone: $phone) { success message } }",
        variables: { phone: intlPhone },
      };
    default:
      return patchPhoneFields(originalBody, intlPhone);
  }
};

const buildStrategies = (input: ProxyRequest): unknown[] => {
  const phone = findPhone(input);
  const rawPhone = toRawPhone(phone);
  const intlPhone = toIntlPhone(phone);

  const attempt1 = patchPhoneFields(input.body, rawPhone);
  const attempt2 = patchPhoneFields(input.body, intlPhone);
  const attempt3 = buildSpecialPayload(input.serviceId || "", input.body, rawPhone, intlPhone);

  return [attempt1, attempt2, attempt3];
};

const sanitizeHeaders = (input?: Record<string, unknown>): Record<string, string> => {
  const out: Record<string, string> = {};
  if (!input) return out;

  for (const [rawKey, rawVal] of Object.entries(input)) {
    const key = rawKey.toLowerCase().trim();
    if (!key || HOP_BY_HOP_HEADERS.has(key)) continue;

    if (typeof rawVal === "string") out[key] = rawVal;
    else if (typeof rawVal === "number" || typeof rawVal === "boolean") out[key] = String(rawVal);
    else if (Array.isArray(rawVal)) out[key] = rawVal.map(String).join(", ");
  }

  return out;
};

const toUpstreamBody = (
  method: string,
  payload: unknown,
  headers: Record<string, string>
): BodyInit | undefined => {
  if (method === "GET" || method === "HEAD") return undefined;
  if (payload === undefined || payload === null) return undefined;

  if (typeof payload === "string") {
    if (!headers["content-type"]) headers["content-type"] = "text/plain; charset=utf-8";
    return payload;
  }

  if (!headers["content-type"]) headers["content-type"] = "application/json";
  return JSON.stringify(payload);
};

const fetchWithTimeout = async (url: string, init: RequestInit, timeoutMs: number): Promise<Response> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...init, signal: controller.signal, redirect: "follow" });
  } finally {
    clearTimeout(timer);
  }
};

const setCors = (req: VercelRequest, res: VercelResponse): boolean => {
  const origin = typeof req.headers.origin === "string" ? req.headers.origin : "";
  const allowlist = parseCsv(process.env.CORS_ALLOWED_ORIGINS);

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
    typeof req.headers["access-control-request-headers"] === "string"
      ? req.headers["access-control-request-headers"]
      : "Content-Type, Authorization"
  );
  res.setHeader("Access-Control-Max-Age", "600");
  return true;
};

const assertAllowlistedHost = (url: URL): boolean => {
  const allowlist = parseCsv(process.env.PROXY_ALLOWLIST);
  if (allowlist.length === 0) return false;
  return allowlist.includes(url.hostname.toLowerCase());
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!setCors(req, res)) return res.status(403).json({ error: "CORS origin not allowed" });
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const input = parseBody(req.body);

    if (!input.serviceUrl || typeof input.serviceUrl !== "string") {
      return res.status(400).json({ error: "Missing serviceUrl" });
    }

    const method = (input.serviceMethod || "POST").toUpperCase().trim();

    let target: URL;
    try {
      target = new URL(input.serviceUrl);
    } catch {
      return res.status(400).json({ error: "Invalid serviceUrl" });
    }

    if (target.protocol !== "https:") {
      return res.status(400).json({ error: "Only https URLs are allowed" });
    }

    if (!assertAllowlistedHost(target)) {
      return res.status(403).json({ error: "Target host is not allowlisted" });
    }

    const baseHeaders = sanitizeHeaders(input.serviceHeaders);
    if (!baseHeaders["user-agent"]) baseHeaders["user-agent"] = "UnifiedNotificationProxy/1.0";
    if (!baseHeaders.origin) baseHeaders.origin = target.origin;
    if (!baseHeaders.referer) baseHeaders.referer = `${target.origin}/`;

    const strategies = buildStrategies(input);
    const timeoutMs = Number(process.env.PROXY_TIMEOUT_MS || DEFAULT_TIMEOUT_MS);

    const transportErrors: string[] = [];
    let lastFailure: UpstreamFailure | null = null;

    for (let i = 0; i < strategies.length; i++) {
      const headers = { ...baseHeaders };
      const body = toUpstreamBody(method, strategies[i], headers);

      try {
        const upstream = await fetchWithTimeout(
          target.toString(),
          { method, headers, body },
          timeoutMs
        );

        const text = await upstream.text();
        const contentType = upstream.headers.get("content-type") || undefined;

        if (upstream.ok) {
          if (contentType) res.setHeader("Content-Type", contentType);
          res.setHeader("X-Proxy-Attempt", String(i + 1));
          return res.status(upstream.status).send(text);
        }

        lastFailure = {
          status: upstream.status,
          text,
          contentType,
          attempt: i + 1,
        };
      } catch (err: any) {
        transportErrors.push(`attempt ${i + 1}: ${err?.message || "fetch failed"}`);
      }
    }

    if (lastFailure) {
      if (lastFailure.contentType) res.setHeader("Content-Type", lastFailure.contentType);
      res.setHeader("X-Proxy-Attempt", String(lastFailure.attempt));
      return res.status(lastFailure.status).send(lastFailure.text);
    }

    return res.status(502).json({
      error: "All attempts failed before receiving upstream response",
      details: transportErrors,
    });
  } catch (err: any) {
    return res.status(500).json({
      error: "Proxy execution error",
      message: err?.message || "Unknown error",
    });
  }
}
