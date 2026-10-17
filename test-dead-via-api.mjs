// Test all dead endpoints through the Vite app's internal proxy endpoint
import { readFileSync, writeFileSync } from 'fs';

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

// Map headers by proximity to the id
function getHeadersForId(id) {
  const idIdx = content.indexOf(`id: '${id}'`);
  const afterId = content.substring(idIdx);
  const hMatch = afterId.match(/headers:\s*(\{[^}]+\})/);
  if (!hMatch) return {};
  const hStr = hMatch[1];
  // Parse the headers object
  try {
    return JSON.parse(hStr.replace(/(\w+):/g, '"$1":').replace(/'/g, '"'));
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

const dead = endpoints.filter(e => e.status === 'dead');
const working = endpoints.filter(e => e.status === 'working' || e.status === 'limited');

// Dedup
const seen = new Set();
const uniqueDead = dead.filter(e => {
  if (seen.has(e.id)) return false;
  seen.add(e.id);
  return true;
});

console.log(`Total: ${endpoints.length}, Dead: ${uniqueDead.length}, Working: ${working.length}`);

// Known alternative paths
const ALT_PATHS = {
  // Sites using known working platforms
  decathlon: ['https://www.decathlon.com.tr/api/auth/register/send-otp', 'https://www.decathlon.com.tr/api/v1/auth/register/send-otp'],
  mediamarkt: [
    'https://www.mediamarkt.com.tr/api/v1/auth/register/sendOtp',
    'https://www.mediamarkt.com.tr/api/auth/register/send-otp',
    'https://www.mediamarkt.com.tr/rest/user-edge/auth/login/otp',
  ],
  carrefour: ['https://www.carrefoursa.com/api/auth/register/send-otp', 'https://www.carrefoursa.com/rest/user-edge/auth/login/otp'],
  watsons: ['https://www.watsons.com.tr/api/auth/register/send-otp'],
  rossmann: ['https://www.rossmann.com.tr/api/v1/auth/register/sendOtp', 'https://www.rossmann.com.tr/api/auth/register/send-otp'],
  gratis: ['https://gratis.com/api/v1/auth/register/send-otp', 'https://www.gratis.com/api/v1/auth/register/send-otp'],
  avon: ['https://www.avon.com.tr/api/auth/register/send-otp', 'https://www.avon.com.tr/api/v1/auth/register/send-otp'],
  oriflame: ['https://www.oriflame.com.tr/api/auth/register/sendOtp', 'https://www.oriflame.com.tr/api/v1/auth/register/sendOtp'],
  farmasi: ['https://www.farmasi.com.tr/api/auth/register/send-otp', 'https://www.farmasi.com.tr/api/v1/auth/register/send-otp'],
  hm: ['https://www2.hm.com/tr_tr/api/auth/register/sendOtp', 'https://www.hm.com/tr/api/customer/register/sendOtp'],
  zara: ['https://www.zara.com/tr/api/auth/register/sendOtp', 'https://www.zara.com/tr/api/v1/auth/register/sendOtp'],
  bershka: ['https://www.bershka.com/tr/api/auth/register/sendOtp', 'https://www.bershka.com/itxrest/2/auth/register/send-otp'],
  pull_bear: ['https://www.pullandbear.com/tr/api/auth/register/sendOtp', 'https://www.pullandbear.com/itxrest/2/auth/register/send-otp'],
  stradivarius: ['https://www.stradivarius.com/tr/api/auth/register/sendOtp'],
  massimo_dutti: ['https://www.massimodutti.com/tr/api/auth/register/sendOtp'],
  mango: ['https://shop.mango.com/services/user/v1/register/sendOtp'],
  decathlon: ['https://www.decathlon.com.tr/api/v1/auth/register/send-otp'],
  penti: [
    'https://www.penti.com/api/v1/auth/register/sendOtp',
    'https://www.penti.com/api/auth/register/send-otp',
    'https://www.penti.com/api/v1/otp/send',
  ],
  a101: [
    'https://www.a101.com.tr/api/v1/auth/register/send-otp',
    'https://www.a101.com.tr/api/v1/auth/register/sendOtp',
    'https://www.a101.com.tr/api/v1/otp/send',
  ],
  jimmy_key: ['https://www.jimmykey.com/tr/api/member/sendOtp', 'https://www.jimmykey.com/tr/api/v1/auth/register/sendOtp'],
  alix_avien: ['https://www.alixavien.com.tr/api/v1/auth/register/sendOtp', 'https://www.alixavien.com.tr/api/auth/register/send-otp'],
  kitapyurdu: ['https://www.kitapyurdu.com/api/v1/auth/register/sendOtp', 'https://www.kitapyurdu.com/api/v1/otp/send'],
  bkm_kitap: ['https://www.bkmkitap.com/api/v1/auth/register/sendOtp', 'https://www.bkmkitap.com/api/v1/otp/send'],
  toyzz_shop: ['https://www.toyzzshop.com/api/v1/auth/register/sendOtp', 'https://www.toyzzshop.com/api/v1/otp/send'],
  dr: ['https://www.dr.com.tr/api/v1/auth/register/sendOtp', 'https://www.dr.com.tr/api/v1/otp/send'],
  kim_gb_ister: ['https://api.kimgbister.com/api/v1/auth/otp/send'],
  starbucks: ['https://www.starbucks.com.tr/api/v1/auth/register/otp', 'https://www.starbucks.com.tr/api/v1/auth/register/send-otp'],
  cineverse: [
    'https://www.paribucineverse.com/api/v1/auth/register/send-otp',
    'https://www.paribucineverse.com/api/v1/auth/register/sendOtp',
  ],
  marti: ['https://www.marti.tech/api/v1/auth/otp/send', 'https://www.marti.tech/api/auth/otp/send'],
  wmf: ['https://wmf.com.tr/users/register/', 'https://www.wmf.com.tr/api/v1/auth/register/sendOtp'],
  kuryem_gelsin: ['https://www.kuryemgelsin.com/api/v1/auth/otp/send'],
  hey_scooter: ['https://www.heyscooter.com.tr/api/v1/auth/otp/send'],
};

async function testViaProxy(ep) {
  const proxyUrl = 'http://localhost:3001/api/proxy';

  const payload = ep.payload
    ? JSON.parse(
        ep.payload
          .replace(/{{PHONE}}/g, '5321111111')
          .replace(/{{EMAIL}}/g, 'test@test.com')
          .replace(/905XXXXXXXXX/g, '905321111111')
          .replace(/05XXXXXXXXX/g, '05532111111')
          .replace(/5XXXXXXXXX/g, '5321111111')
          .replace(/\+90\{\{PHONE\}\}/g, '+905321111111')
          .replace(/\+905XXXXXXXXX/g, '+905321111111'),
      )
    : { phone: '5321111111' };

  try {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), 15000);
    const res = await fetch(proxyUrl, {
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
    return { ok: data.ok, status: res.status, strategy: data.strategy, upstreamStatus: data.upstreamStatus, error: data.error };
  } catch (e) {
    return { ok: false, status: 0, strategy: 'error', error: e.message };
  }
}

async function testDirect(endpointUrl, method, payload) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 10000);
  try {
    const headers = { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' };
    const body = payload ? JSON.stringify(typeof payload === 'object' ? payload : JSON.parse(payload)) : undefined;
    const res = await fetch(endpointUrl, { method, headers, body, signal: c.signal });
    clearTimeout(t);
    return { ok: res.ok || res.status === 202, status: res.status, statusText: res.statusText };
  } catch (e) {
    clearTimeout(t);
    return { ok: false, status: 0, statusText: e.cause?.code || e.code || e.message };
  }
}

async function main() {
  // Prioritize sites that are most promising
  const priorityOrder = [
    // E-commerce platforms (likely to have working endpoints with right URL)
    'decathlon',
    'hm',
    'zara',
    'bershka',
    'pull_bear',
    'stradivarius',
    'massimo_dutti',
    'mediamarkt',
    'vatan_bilgisayar',
    'itopya',
    'gamegaraj',
    'carrefour',
    'rossmann',
    'watsons',
    'gratis',
    'penti',
    'a101',
    'wmf',
    'dr',
    'kitapyurdu',
    'bkm_kitap',
    'toyzz_shop',
    'avon',
    'oriflame',
    'farmasi',
    'starbucks',
    'cineverse',
    'kuryem_gelsin',
    'hey_scooter',
    'mango',
    'marti',
    'alix_avien',
    'jimmy_key',
    // Harder ones
    'iste_gelsin',
    'tikla_gelsin',
    'clickme_live',
    'mothercare',
    'paybol',
    'kim_gb_ister',
    'ipragaz',
    'tasimacim',
    'hizli_ecza',
    'sancaktepe_belediye',
    'fatih_belediye',
    'bayrampasa_belediye',
    'bodrum_belediye',
    // Platform/Game
    'playstation',
    'xbox',
    'nintendo',
    'steam',
    'epic_games',
    // Custom/Complex
    'joker',
    'ido',
    'hamidiye',
    'tasdelen_su',
    'pidem',
    'orwi',
    'tazi',
    'bisu',
    'naosstars',
    'akasya_avm',
    'akbati',
    'herbalife',
    'amway',
    'forever_living',
    'lr',
  ];

  const toTest = priorityOrder.map(id => uniqueDead.find(e => e.id === id)).filter(Boolean);
  const results = [];

  console.log(`Testing ${toTest.length} endpoints...\n`);

  for (let i = 0; i < toTest.length; i++) {
    const ep = toTest[i];
    const result = {
      id: ep.id,
      name: ep.name,
      directOk: false,
      directStatus: 0,
      proxyOk: false,
      proxyStatus: 0,
      proxyStrategy: '',
      altUrls: [],
    };

    // 1. Try direct
    const direct = await testDirect(ep.url, ep.method, ep.payload);
    result.directOk = direct.ok;
    result.directStatus = direct.status;

    // 2. Try through proxy (comprehensive strategies)
    if (!direct.ok) {
      const proxy = await testViaProxy(ep);
      result.proxyOk = proxy.ok;
      result.proxyStatus = proxy.upstreamStatus || proxy.status || 0;
      result.proxyStrategy = proxy.strategy || '';
      result.proxyError = proxy.error || '';
    }

    // 3. Try alternative URLs directly
    if (!direct.ok && !result.proxyOk) {
      const alts = ALT_PATHS[ep.id] || [];
      for (const altUrl of alts) {
        const alt = await testDirect(altUrl, 'POST', ep.payload);
        result.altUrls.push({ url: altUrl, ok: alt.ok, status: alt.status });
        if (alt.ok) break;
        await new Promise(r => setTimeout(r, 200));
      }
    }

    // Output
    const directStr = result.directOk ? '✅' : `❌${result.directStatus}`;
    const proxyStr = result.proxyOk ? `✅ ${result.proxyStrategy}` : result.proxyStatus ? `❌${result.proxyStatus}` : '❌';
    const altStr = result.altUrls.some(a => a.ok) ? ' ✅ alt' : '';

    console.log(
      `${result.proxyOk ? '✅' : result.altUrls.some(a => a.ok) ? '🔄' : '❌'} ${ep.name.padEnd(20)} direct=${directStr}  proxy=${proxyStr}${altStr}`,
    );

    results.push(result);

    // Rate limit
    if (i < toTest.length - 1) await new Promise(r => setTimeout(r, 300));
  }

  const workingViaProxy = results.filter(r => r.proxyOk);
  const workingViaAlt = results.filter(r => !r.proxyOk && r.altUrls.some(a => a.ok));

  console.log(`\n\n=== SUMMARY ===`);
  console.log(`Tested: ${results.length}`);
  console.log(`Working via proxy: ${workingViaProxy.length}`);
  console.log(`Working via alt URL: ${workingViaAlt.length}`);
  console.log(`Still dead: ${results.length - workingViaProxy.length - workingViaAlt.length}`);

  if (workingViaProxy.length > 0) {
    console.log(`\nWorking via proxy:`);
    workingViaProxy.forEach(r => console.log(`✅ ${r.name} (strategy: ${r.proxyStrategy}, status: ${r.proxyStatus})`));
  }
  if (workingViaAlt.length > 0) {
    console.log(`\nWorking via alt URL:`);
    workingViaAlt.forEach(r => console.log(`🔄 ${r.name}: ${r.altUrls.find(a => a.ok)?.url}`));
  }

  writeFileSync('test-dead-results.json', JSON.stringify(results, null, 2));
  console.log('\nResults saved to test-dead-results.json');
}

main().catch(console.error);
