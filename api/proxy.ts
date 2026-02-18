type ProxyRequestBody = {
  url?: string;
  options?: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  };
};

const getAllowlist = (): string[] => {
  const raw = process.env.PROXY_ALLOWLIST || '';
  return raw
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
};

const pickForwardHeaders = (headers: Record<string, string> | undefined): Record<string, string> => {
  const safeHeaders: Record<string, string> = {};
  if (!headers) return safeHeaders;

  const contentType = headers['Content-Type'] || headers['content-type'];
  const accept = headers['Accept'] || headers['accept'];

  if (typeof contentType === 'string') safeHeaders['Content-Type'] = contentType;
  if (typeof accept === 'string') safeHeaders['Accept'] = accept;

  return safeHeaders;
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = (req.body || {}) as ProxyRequestBody;
  if (!body.url || typeof body.url !== 'string') {
    return res.status(400).json({ error: 'Missing url' });
  }

  let target: URL;
  try {
    target = new URL(body.url);
  } catch {
    return res.status(400).json({ error: 'Invalid url' });
  }

  if (target.protocol !== 'https:') {
    return res.status(400).json({ error: 'Only https URLs are allowed' });
  }

  const allowlist = getAllowlist();
  if (allowlist.length === 0) {
    return res.status(500).json({ error: 'PROXY_ALLOWLIST is not configured' });
  }

  if (!allowlist.includes(target.hostname.toLowerCase())) {
    return res.status(403).json({ error: 'Host is not allowed' });
  }

  const method = (body.options?.method || 'POST').toUpperCase();
  const allowedMethods = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
  if (!allowedMethods.has(method)) {
    return res.status(400).json({ error: 'Method is not allowed for proxying' });
  }

  try {
    const upstream = await fetch(target.toString(), {
      method,
      headers: pickForwardHeaders(body.options?.headers),
      body: typeof body.options?.body === 'string' ? body.options.body : undefined,
    });

    const responseText = await upstream.text();
    const contentType = upstream.headers.get('content-type');

    if (contentType) {
      res.setHeader('content-type', contentType);
    }

    return res.status(upstream.status).send(responseText);
  } catch {
    return res.status(502).json({ error: 'Upstream request failed' });
  }
}
