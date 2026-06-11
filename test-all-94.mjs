import fs from 'fs';
import axios from 'axios';

const T = '5343622375';
const PROXY = 'http://localhost:3001/api/proxy';

// Parse constants.ts to extract endpoint definitions
const src = fs.readFileSync('constants.ts', 'utf8');

function extractObjects(text) {
  const objects = [];
  let depth = 0;
  let start = -1;
  let inString = false;
  let stringChar = '';
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inString) {
      if (c === '\\') { i++; continue; }
      if (c === stringChar) inString = false;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') { inString = true; stringChar = c; continue; }
    if (c === '{') { 
      if (depth === 0 && text[i-1] !== ':') start = i;
      depth++;
    }
    if (c === '}') {
      depth--;
      if (depth === 0 && start >= 0) {
        const block = text.substring(start, i+1);
        if (block.includes('id:') && block.includes('url:')) {
          objects.push(block);
        }
        start = -1;
      }
    }
  }
  return objects;
}

function extractValue(obj, key) {
  const regex = new RegExp(`${key}:\\s*'([^']+)'`);
  const m = obj.match(regex);
  return m ? m[1] : null;
}

function extractHeaders(obj) {
  const m = obj.match(/headers:\s*({[^}]+})/);
  if (!m) return {};
  try {
    return JSON.parse(m[1].replace(/(\w+):/g, '"$1":').replace(/'/g, '"'));
  } catch { return {}; }
}

function interpolatePhone(payloadInfo, phone) {
  if (!payloadInfo) return { phone };
  let str = payloadInfo;
  str = str.replace(/{{PHONE}}/g, phone);
  str = str.replace(/{{EMAIL}}/g, 'test@test.com');
  str = str.replace(/\+905XXXXXXXXX/g, `+90${phone}`);
  str = str.replace(/905XXXXXXXXX/g, `90${phone}`);
  str = str.replace(/05XXXXXXXXX/g, `0${phone}`);
  str = str.replace(/5XXXXXXXXX/g, phone);
  try { return JSON.parse(str); } catch { return { phone }; }
}

const blocks = extractObjects(src);
console.log(`Parsed ${blocks.length} endpoint definitions\n`);

const BATCH_SIZE = 5;

const allResults = [];
let batchIdx = 0;

for (let i = 0; i < blocks.length; i += BATCH_SIZE) {
  const batch = blocks.slice(i, i + BATCH_SIZE);
  const batchResults = await Promise.all(batch.map(async (block) => {
    const id = extractValue(block, 'id');
    const url = extractValue(block, 'url');
    const method = extractValue(block, 'method') || 'POST';
    const payloadInfo = extractValue(block, 'payloadInfo');
    const headers = extractHeaders(block);
    
    if (!id || !url) return null;
    batchIdx++;
    
    const payload = interpolatePhone(payloadInfo, T);
    
    try {
      const r = await axios.post(PROXY, {
        serviceId: id,
        serviceUrl: url,
        serviceMethod: method,
        targetPhone: T,
        email: 'test@test.com',
        initialPayload: payload,
        serviceHeaders: headers,
        allowAiHealing: false
      }, { timeout: 25000, validateStatus: () => true });
      
      const strat = r.data?.strategy || 'direct';
      const up = r.data?.upstreamStatus || 0;
      
      const status = strat === 'force_success' ? 'forced' : (up >= 200 && up < 300 ? 'real' : 'failed');
      return { id, status, code: up, strat, url };
    } catch (err) {
      return { id, status: 'error', code: 0, strat: err.code || 'NETWORK_ERR', url };
    }
  }));
  
  for (const r of batchResults) {
    if (!r) continue;
    allResults.push(r);
    const icon = r.status === 'real' ? '✅' : r.status === 'forced' ? '⚠️' : r.status === 'failed' ? '❌' : '💥';
    console.log(`${icon} ${r.id.padEnd(24)} ${r.code} (${r.strat || '?'})`);
  }
  
  if (i + BATCH_SIZE < blocks.length) {
    await new Promise(r => setTimeout(r, 3000));
  }
}

const results = allResults;
console.log(`Toplam: ${results.length}`);
const real = results.filter(r => r.status === 'real').length;
const failed = results.filter(r => r.status === 'failed').length;
const forced = results.filter(r => r.status === 'forced').length;
const errors = results.filter(r => r.status === 'error').length;
console.log(`✅ Gerçek başarılı: ${real}`);
console.log(`❌ Hata döndü: ${failed}`);
console.log(`⚠️ Force-success: ${forced}`);
console.log(`💥 Network hatası: ${errors}`);

if (failed > 0 || forced > 0 || errors > 0) {
  console.log(`\nBaşarısız/Force olanlar:`);
  for (const r of results) {
    if (r.status !== 'real') {
      const icon = r.status === 'failed' ? '❌' : r.status === 'forced' ? '⚠️' : '💥';
      console.log(`  ${icon} ${r.id.padEnd(24)} ${r.code} (${r.strat})`);
    }
  }
}

fs.writeFileSync('test-94-results.json', JSON.stringify(results, null, 2));
console.log('\nSonuçlar test-94-results.json\'a kaydedildi.');
