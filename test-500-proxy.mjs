// Test 500/401 endpoints through proxy with AI healing
import { readFileSync } from 'fs';

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

// These endpoints return 500/401 but are reachable - payload might be fixable
const promising = endpoints.filter(
  e =>
    e.status === 'dead' &&
    (e.id === 'herbalife' ||
      e.id === 'bkm_kitap' ||
      e.id === 'fatih_belediye' ||
      e.id === 'bayrampasa_belediye' ||
      e.id === 'sancaktepe_belediye' ||
      e.id === 'bodrum_belediye' ||
      e.id === 'orwi' ||
      e.id === 'bisu' ||
      e.id === 'kim_gb_ister' ||
      e.id === 'joker' ||
      e.id === 'ido' ||
      e.id === 'tasdelen_su' ||
      e.id === 'pidem' ||
      e.id === 'tazi'),
);

const PROXY = 'http://localhost:3001/api/proxy';

function interpolatePayload(payloadStr, phone = '5321111111', email = 'test@test.com') {
  if (!payloadStr) return { phone };
  let str = payloadStr;
  const phoneRE = /\{\{PHONE\}\}/g;
  str = str.replace(phoneRE, phone);
  str = str.replace(/\{\{EMAIL\}\}/g, email);
  str = str.replace(/\+905XXXXXXXXX/g, `+90${phone}`);
  str = str.replace(/905XXXXXXXXX/g, `90${phone}`);
  str = str.replace(/05XXXXXXXXX/g, `0${phone}`);
  str = str.replace(/5XXXXXXXXX/g, phone);
  str = str.replace(/\+90\{\{PHONE\}\}/g, `+90${phone}`);
  try {
    return JSON.parse(str);
  } catch {
    return { phone };
  }
}

async function testViaProxy(ep) {
  const payload = interpolatePayload(ep.payload);
  try {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), 20000);
    const res = await fetch(PROXY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serviceId: ep.id,
        serviceUrl: ep.url,
        serviceMethod: ep.method,
        serviceHeaders: ep.headers,
        targetPhone: '5321111111',
        email: 'test@test.com',
        initialPayload: payload,
        allowAiHealing: true,
      }),
      signal: c.signal,
    });
    clearTimeout(t);
    const data = await res.json();
    return {
      ok: data.ok,
      upstreamStatus: data.upstreamStatus,
      strategy: data.strategy,
      error: data.error,
      healedPayload: data.healedPayload,
    };
  } catch (e) {
    return { ok: false, upstreamStatus: 0, strategy: 'error', error: e.message };
  }
}

async function main() {
  console.log(`Testing ${promising.length} promising endpoints through proxy...\n`);

  for (const ep of promising) {
    const result = await testViaProxy(ep);
    const icon = result.ok ? '✅' : '❌';
    console.log(`${icon} ${ep.name.padEnd(20)} strategy=${(result.strategy || 'none').padEnd(15)} upstream=${result.upstreamStatus}`);
    if (result.ok) {
      console.log(`   Payload: ${JSON.stringify(result.healedPayload || {})}`);
    } else if (result.error) {
      console.log(`   Error: ${(result.error || '').substring(0, 100)}`);
    }
    await new Promise(r => setTimeout(r, 500));
  }
}

main().catch(console.error);
