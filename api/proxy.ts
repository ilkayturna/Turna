type ProxyRequestBody = {
  serviceId?: string;
  serviceUrl?: string;
  serviceMethod?: string;
  serviceHeaders?: Record<string, string>;
  targetPhone?: string;
  email?: string;
};

const formatPhone = (phone: string, formatType: 'raw' | 'zero' | '90' | 'plus90' | 'space'): string => {
  const p = phone.replace(/\D/g, '');
  switch (formatType) {
    case 'zero':
      return `0${p}`;
    case '90':
      return `90${p}`;
    case 'plus90':
      return `+90${p}`;
    case 'space':
      return `0 (${p.substring(0, 3)}) ${p.substring(3, 6)} ${p.substring(6, 8)} ${p.substring(8)}`;
    case 'raw':
    default:
      return p;
  }
};

const withHttps = (url: string): string => {
  if (url.startsWith('https://') || url.startsWith('http://')) {
    return url.replace(/^http:\/\//, 'https://');
  }
  return `https://${url}`;
};

const pickHeaders = (headers: Record<string, string> | undefined): Record<string, string> => {
  if (!headers) return {};
  const result: Record<string, string> = {};
  for (const [k, v] of Object.entries(headers)) {
    if (typeof v !== 'string') continue;
    if (!/^[a-z0-9-]+$/i.test(k)) continue;
    result[k] = v;
  }
  return result;
};

const parseBody = (req: any): ProxyRequestBody => {
  const raw = req?.body;
  if (!raw) return {};
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
  return raw as ProxyRequestBody;
};

const buildRequestParams = (body: ProxyRequestBody) => {
  const serviceId = body.serviceId || '';
  const serviceUrl = body.serviceUrl || '';
  const targetPhone = body.targetPhone || '';
  const methodRaw = (body.serviceMethod || 'POST').toUpperCase();
  const method = methodRaw === 'GET' ? 'GET' : 'POST';

  if (!serviceUrl || typeof serviceUrl !== 'string') {
    throw new Error('Missing serviceUrl');
  }

  const targetUrl = withHttps(serviceUrl);
  let parsed: URL;
  try {
    parsed = new URL(targetUrl);
  } catch {
    throw new Error('Invalid serviceUrl');
  }

  if (parsed.protocol !== 'https:') {
    throw new Error('Only https serviceUrl is allowed');
  }

  const serviceHeaders = pickHeaders(body.serviceHeaders);
  const cleanMail = body.email || 'memati.bas@example.com';

  const commonHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json, text/plain, */*',
    ...serviceHeaders,
  };

  switch (serviceId) {
    case 'kahve_dunyasi':
      return {
        url: targetUrl,
        options: {
          method,
          headers: commonHeaders,
          body: JSON.stringify({ countryCode: '90', phoneNumber: formatPhone(targetPhone, 'raw') }),
        },
      };
    default:
      return {
        url: targetUrl,
        options: {
          method,
          headers: commonHeaders,
          body: method === 'GET' ? undefined : JSON.stringify({ phone: formatPhone(targetPhone, 'raw'), email: cleanMail }),
        },
      };
  }
};

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const body = parseBody(req);
    if (!body.serviceId || typeof body.serviceId !== 'string') {
      return res.status(400).json({ error: 'Missing serviceId' });
    }

    if (!body.targetPhone || typeof body.targetPhone !== 'string') {
      return res.status(400).json({ error: 'Missing targetPhone' });
    }

    const { url, options } = buildRequestParams(body);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const upstream = await fetch(url, {
      method: options.method,
      headers: options.headers,
      body: options.body,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const responseText = await upstream.text();
    return res.status(200).json({
      reachable: true,
      ok: upstream.ok,
      status: 200,
      upstreamStatus: upstream.status,
      serviceId: body.serviceId,
      hasBody: responseText.length > 0,
    });
  } catch (error: any) {
    return res.status(200).json({
      reachable: false,
      ok: false,
      status: 500,
      error: error?.message || 'Proxy internal error',
    });
  }
}
