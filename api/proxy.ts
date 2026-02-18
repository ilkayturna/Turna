type ProxyRequestBody = {
  serviceId?: string;
  serviceUrl?: string;
  serviceMethod?: string;
  serviceHeaders?: Record<string, unknown>;
  targetPhone?: string;
  email?: string;
  body?: unknown;
};

const BLOCKED_HEADERS = new Set([
  'host',
  'content-length',
  'connection',
  'transfer-encoding',
  'keep-alive',
  'upgrade',
  'proxy-authorization',
  'proxy-authenticate',
]);

const UA_CHROME =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36';

const parseBody = (raw: unknown): ProxyRequestBody => {
  if (!raw) return {};
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as ProxyRequestBody;
    } catch {
      return {};
    }
  }
  if (typeof raw === 'object') return raw as ProxyRequestBody;
  return {};
};

const withHttps = (url: string): string => {
  const value = url.trim();
  if (!value) return value;
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value.replace(/^http:\/\//i, 'https://');
  }
  if (value.startsWith('//')) return `https:${value}`;
  return `https://${value}`;
};

const sanitizeHeaders = (input: Record<string, unknown> | undefined): Record<string, string> => {
  const out: Record<string, string> = {};
  if (!input) return out;

  for (const [rawKey, rawValue] of Object.entries(input)) {
    const key = rawKey.toLowerCase().trim();
    if (!key || BLOCKED_HEADERS.has(key)) continue;
    if (!/^[a-z0-9-]+$/i.test(key)) continue;

    if (typeof rawValue === 'string') out[key] = rawValue;
    else if (typeof rawValue === 'number' || typeof rawValue === 'boolean') out[key] = String(rawValue);
    else if (Array.isArray(rawValue)) out[key] = rawValue.map((v) => String(v)).join(', ');
  }

  return out;
};

const formatPhone = (phone: string, formatType: 'raw' | '90'): string => {
  const p = (phone || '').replace(/\D/g, '');
  if (formatType === '90') return `90${p}`;
  return p;
};

const buildRequestPayload = (body: ProxyRequestBody, method: string): string | undefined => {
  if (method === 'GET' || method === 'HEAD') return undefined;

  if (typeof body.body === 'string') return body.body;
  if (body.body !== undefined) return JSON.stringify(body.body);

  // Backward compatible default payload for old simulator flow.
  const targetPhone = body.targetPhone || '';
  const cleanMail = body.email || 'memati.bas@example.com';

  if (body.serviceId === 'kahve_dunyasi') {
    return JSON.stringify({ countryCode: '90', phoneNumber: formatPhone(targetPhone, 'raw') });
  }

  return JSON.stringify({
    phone: formatPhone(targetPhone, 'raw'),
    email: cleanMail,
  });
};

const jsonResponse = (res: any, payload: Record<string, unknown>) => {
  return res.status(200).json(payload);
};

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = parseBody(req.body);

    if (!body.serviceId || typeof body.serviceId !== 'string') {
      return jsonResponse(res, { reachable: false, ok: false, status: 400, error: 'Missing serviceId' });
    }

    if (!body.targetPhone || typeof body.targetPhone !== 'string') {
      return jsonResponse(res, { reachable: false, ok: false, status: 400, error: 'Missing targetPhone' });
    }

    if (!body.serviceUrl || typeof body.serviceUrl !== 'string') {
      return jsonResponse(res, { reachable: false, ok: false, status: 400, error: 'Invalid serviceUrl' });
    }

    const normalizedUrl = withHttps(body.serviceUrl);

    let target: URL;
    try {
      target = new URL(normalizedUrl);
    } catch {
      return jsonResponse(res, {
        reachable: false,
        ok: false,
        status: 400,
        error: 'Invalid serviceUrl',
        received: body.serviceUrl,
      });
    }

    const method = (body.serviceMethod || 'POST').toUpperCase();
    const headers = sanitizeHeaders(body.serviceHeaders);

    headers['user-agent'] = UA_CHROME;
    headers.origin = target.origin;
    headers.referer = `${target.origin}/`;

    const fetchBody = buildRequestPayload(body, method);
    if (fetchBody && !headers['content-type']) headers['content-type'] = 'application/json';

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9000);

    let upstream: Response;
    try {
      upstream = await fetch(target.toString(), {
        method,
        headers,
        body: fetchBody,
        redirect: 'follow',
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    const upstreamText = await upstream.text();
    return jsonResponse(res, {
      reachable: true,
      ok: upstream.ok,
      status: 200,
      upstreamStatus: upstream.status,
      serviceId: body.serviceId,
      hasBody: upstreamText.length > 0,
      error: upstream.ok ? undefined : upstreamText.slice(0, 300),
    });
  } catch (error: any) {
    return jsonResponse(res, {
      reachable: false,
      ok: false,
      status: 500,
      error: error?.message || 'fetch failed',
    });
  }
}
