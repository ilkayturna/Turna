// Test alternative URL patterns for dead endpoints
import { readFileSync } from 'fs';

const content = readFileSync('constants.ts', 'utf-8');

const idRegex = /id:\s*'([^']+)'/g;
const nameRegex = /name:\s*'([^']+)'/g;
const urlRegex = /url:\s*'([^']+)'/g;
const methodRegex = /method:\s*'([^']+)'/g;
const statusRegex = /status:\s*'([^']+)'/g;
const payloadRegex = /payloadInfo:\s*'([^']+)'/g;

const idVals = [...content.matchAll(idRegex)].map(m => m[1]);
const nameVals = [...content.matchAll(nameRegex)].map(m => m[1]);
const urlVals = [...content.matchAll(urlRegex)].map(m => m[1]);
const methodVals = [...content.matchAll(methodRegex)].map(m => m[1]);
const statusVals = [...content.matchAll(statusRegex)].map(m => m[1]);
const payloadVals = [...content.matchAll(payloadRegex)].map(m => m[1]);

const endpoints = idVals.map((id, i) => ({
  id, name: nameVals[i] || '',
  url: urlVals[i] || '',
  method: methodVals[i] || 'POST',
  status: statusVals[i] || 'unknown',
  payload: payloadVals[i] || '',
}));

// Endpoints with 404 error - wrong URL paths
const fourOhFour = endpoints.filter(e => e.status === 'dead' && e.url && !e.url.includes('api.') && !e.id.includes('belediye'));

// Generate alternative paths for each site
const alternatives = {
  // Inditex group - Massimo Dutti works with /tr/api/auth/register/sendOtp
  zara: ['https://www.zara.com/tr/api/auth/register/sendOtp', 'https://www.zara.com/tr/api/v1/auth/register/sendOtp'],
  bershka: ['https://www.bershka.com/tr/api/auth/register/sendOtp', 'https://www.bershka.com/itxrest/2/auth/register/send-otp'],
  pull_bear: ['https://www.pullandbear.com/tr/api/auth/register/sendOtp', 'https://www.pullandbear.com/itxrest/2/auth/register/send-otp'],
  stradivarius: ['https://www.stradivarius.com/tr/api/auth/register/sendOtp', 'https://www.stradivarius.com/itxrest/2/auth/register/send-otp'],
  
  // Other fashion
  hm: ['https://www2.hm.com/tr_tr/api/auth/register/sendOtp', 'https://www2.hm.com/tr_tr/api/customer/sendOtpCode'],
  mango: ['https://shop.mango.com/services/user/v1/register/sendOtp', 'https://shop.mango.com/tr/services/user/v1/register/send-otp'],
  
  // e-commerce Market
  carrefour: ['https://www.carrefoursa.com/api/auth/register/send-otp', 'https://www.carrefoursa.com/rest/user-edge/auth/login/otp'],
  rossmann: ['https://www.rossmann.com.tr/api/v1/auth/register/sendOtp', 'https://www.rossmann.com.tr/api/auth/register/send-otp', 'https://www.rossmann.com.tr/services/user/register/send-otp'],
  watsons: ['https://www.watsons.com.tr/api/auth/register/send-otp', 'https://www.watsons.com.tr/rest/user-edge/auth/login/otp'],
  gratis: ['https://www.gratis.com/api/v1/auth/register/send-otp', 'https://www.gratis.com/api/auth/register/sendOtp'],
  
  // Tech
  mediamarkt: ['https://www.mediamarkt.com.tr/api/v1/auth/register/sendOtp', 'https://www.mediamarkt.com.tr/api/auth/register/send-otp', 'https://www.mediamarkt.com.tr/rest/user-edge/auth/login/otp'],
  vatan_bilgisayar: ['https://www.vatanbilgisayar.com/api/v1/auth/register/send-otp', 'https://www.vatanbilgisayar.com/api/auth/register/sendOtp'],
  itopya: ['https://www.itopya.com/api/v1/auth/register/send-otp', 'https://www.itopya.com/api/auth/register/sendOtp'],
  gamegaraj: ['https://www.gamegaraj.com/api/v1/auth/register/send-otp', 'https://www.gamegaraj.com/api/auth/register/sendOtp'],
  
  // Cosmetic
  avon: ['https://www.avon.com.tr/api/v1/auth/register/send-otp', 'https://www.avon.com.tr/api/auth/register/sendOtp'],
  oriflame: ['https://www.oriflame.com.tr/api/v1/auth/register/sendOtp', 'https://www.oriflame.com.tr/api/auth/register/send-otp'],
  farmasi: ['https://www.farmasi.com.tr/api/v1/auth/register/send-otp', 'https://www.farmasi.com.tr/api/auth/register/sendOtp'],
  herbalife: ['https://www.herbalife.com.tr/api/v1/auth/register/send-otp', 'https://www.herbalife.com.tr/api/auth/register/sendOtp'],
  amway: ['https://www.amway.com.tr/api/v1/auth/register/sendOtp', 'https://www.amway.com.tr/api/auth/register/send-otp'],
  lr: ['https://www.lrworld.com/tr/api/v1/auth/register/send-otp', 'https://www.lrworld.com/api/v1/auth/register/send-otp', 'https://neo.lrworld.com/api/v1/login/cas'],
  
  // Food
  starbucks: ['https://www.starbucks.com.tr/api/v1/auth/register/otp', 'https://www.starbucks.com.tr/api/account/register/sendOtp', 'https://www.starbucks.com.tr/api/v1/auth/register/send-otp'],
  
  // Other
  penti: ['https://www.penti.com/api/v1/auth/register/sendOtp', 'https://www.penti.com/api/auth/register/send-otp', 'https://www.penti.com/api/member/sendOtp'],
  dr: ['https://www.dr.com.tr/api/v1/auth/register/sendOtp', 'https://www.dr.com.tr/api/v1/otp/send'],
  kitapyurdu: ['https://www.kitapyurdu.com/api/v1/auth/register/sendOtp', 'https://www.kitapyurdu.com/index.php?route=account/register/send-otp'],
  bkm_kitap: ['https://www.bkmkitap.com/api/v1/auth/register/sendOtp', 'https://www.bkmkitap.com/api/v1/otp/send'],
  toyzz_shop: ['https://www.toyzzshop.com/api/v1/auth/register/sendOtp', 'https://www.toyzzshop.com/api/v1/otp/send'],
  alix_avien: ['https://www.alixavien.com.tr/api/v1/auth/register/sendOtp', 'https://www.alixavien.com.tr/api/auth/register/send-otp'],
  cineverse: ['https://www.paribucineverse.com/api/v1/auth/register/send-otp', 'https://www.paribucineverse.com/api/v1/auth/register/sendOtp'],
  kuryem_gelsin: ['https://www.kuryemgelsin.com/api/v1/auth/otp/send'],
  hey_scooter: ['https://www.heyscooter.com.tr/api/v1/auth/otp/send'],
  a101: ['https://www.a101.com.tr/api/v1/auth/register/send-otp', 'https://www.a101.com.tr/api/v1/auth/register/sendOtp', 'https://www.a101.com.tr/api/v1/otp/send'],
  kim_gb_ister: ['https://api.kimgbister.com/api/v1/auth/otp/send'],
  decathlon: ['https://www.decathlon.com.tr/api/v1/auth/register/send-otp', 'https://www.decathlon.com.tr/api/auth/register/sendOtp'],
  
  // Retail
  jimmy_key: ['https://www.jimmykey.com/tr/api/member/sendOtp', 'https://www.jimmykey.com/tr/api/v1/auth/register/sendOtp'],
  mothercare: ['https://www.mothercare.com.tr/api/v1/auth/register/sendOtp', 'https://www.mothercare.com.tr/api/member/register/send-otp'],
  
  // Platform
  playstation: ['https://store.playstation.com/tr/api/v1/auth/otp/send', 'https://www.playstation.com/tr/api/v1/auth/otp/send'],
  epic_games: ['https://www.epicgames.com/id/api/v1/auth/otp/send'],
  steam: ['https://store.steampowered.com/phone/add_ajaxop'],
};

async function testUrl(url, method = 'POST', payload = '') {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 8000);
  try {
    let body;
    if (payload) {
      try {
        body = JSON.stringify(JSON.parse(payload.replace(/{{PHONE}}/g, '5321111111').replace(/{{EMAIL}}/g, 'test@test.com').replace(/905XXXXXXXXX/g, '905321111111').replace(/05XXXXXXXXX/g, '05532111111').replace(/5XXXXXXXXX/g, '5321111111').replace(/\+905XXXXXXXXX/g, '+905321111111')));
      } catch { body = payload; }
    }
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      body: method === 'POST' ? body : undefined,
      signal: c.signal,
    });
    clearTimeout(t);
    const text = await res.text();
    const is2xx = res.ok || res.status === 202 || res.status === 201;
    return { ok: is2xx, status: res.status, body: text.substring(0, 200) };
  } catch (e) {
    clearTimeout(t);
    return { ok: false, status: 0, body: e.cause?.code || e.code || e.message };
  }
}

async function main() {
  let found = 0;
  
  for (const [id, urls] of Object.entries(alternatives)) {
    const ep = endpoints.find(e => e.id === id);
    if (!ep || ep.status === 'working') continue;
    
    // First test original URL
    const original = await testUrl(ep.url, ep.method, ep.payload);
    if (original.ok) {
      console.log(`⚠️  ${ep.name} original is already working! status=${original.status}`);
      found++;
      continue;
    }
    
    // Test alternatives
    for (const altUrl of urls) {
      if (altUrl === ep.url) continue;
      const result = await testUrl(altUrl, 'POST', ep.payload);
      if (result.ok) {
        console.log(`✅ ${ep.name.padEnd(20)} ${altUrl}`);
        found++;
        break;
      } else {
        console.log(`❌ ${ep.name.padEnd(20)} ${result.status} ${altUrl.substring(0, 60)}`);
      }
      await new Promise(r => setTimeout(r, 200));
    }
  }
  
  console.log(`\n\nTotal found: ${found}`);
}

main().catch(console.error);
