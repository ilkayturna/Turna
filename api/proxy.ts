import { MOCK_SERVICES } from '../constants';

type ProxyRequestBody = {
  serviceId?: string;
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

const buildRequestParams = (serviceId: string, phone: string, mail: string) => {
  const cleanMail = mail || 'memati.bas@example.com';
  const commonHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json, text/plain, */*',
  };

  const service = MOCK_SERVICES.find((item) => item.id === serviceId);
  const method = service?.method || 'POST';
  const serviceHeaders = service?.headers || {};

  switch (serviceId) {
    case 'kahve_dunyasi':
      return {
        url: withHttps(service?.url || 'api.kahvedunyasi.com/api/v1/auth/account/register/phone-number'),
        options: {
          method,
          headers: { ...commonHeaders, ...serviceHeaders },
          body: JSON.stringify({ countryCode: '90', phoneNumber: formatPhone(phone, 'raw') }),
        },
      };
    default:
      return {
        url: withHttps(service?.url || serviceId),
        options: {
          method,
          headers: { ...commonHeaders, ...serviceHeaders },
          body: JSON.stringify({ phone: formatPhone(phone, 'raw'), email: cleanMail }),
        },
      };
  }
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = (req.body || {}) as ProxyRequestBody;
  if (!body.serviceId || typeof body.serviceId !== 'string') {
    return res.status(400).json({ error: 'Missing serviceId' });
  }

  if (!body.targetPhone || typeof body.targetPhone !== 'string') {
    return res.status(400).json({ error: 'Missing targetPhone' });
  }

  const service = MOCK_SERVICES.find((item) => item.id === body.serviceId);
  if (!service) {
    return res.status(404).json({ error: 'Unknown serviceId' });
  }

  const { url, options } = buildRequestParams(body.serviceId, body.targetPhone, body.email || '');

  try {
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
    return res.status(upstream.status).json({
      ok: upstream.ok,
      status: upstream.status,
      serviceId: body.serviceId,
      hasBody: responseText.length > 0,
    });
  } catch {
    return res.status(502).json({
      ok: false,
      status: 502,
      error: 'Upstream request failed',
      serviceId: body.serviceId,
    });
  }
}
