// Fetch JS bundles from sites and extract API endpoint patterns
import { readFileSync, writeFileSync } from 'fs';

const content = readFileSync('constants.ts', 'utf-8');

const idRegex = /id:\s*'([^']+)'/g;
const nameRegex = /name:\s*'([^']+)'/g;
const urlRegex = /url:\s*'([^']+)'/g;

const idVals = [...content.matchAll(idRegex)].map(m => m[1]);
const nameVals = [...content.matchAll(nameRegex)].map(m => m[1]);
const urlVals = [...content.matchAll(urlRegex)].map(m => m[1]);

const endpoints = idVals.map((id, i) => ({ id, name: nameVals[i] || '', url: urlVals[i] || '' }));

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8',
};

async function fetchWithTimeout(url, timeout = 10000) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), timeout);
  try {
    const r = await fetch(url, { headers: BROWSER_HEADERS, signal: c.signal, redirect: 'follow' });
    clearTimeout(t);
    return { ok: r.ok, status: r.status, body: await r.text(), finalUrl: r.url };
  } catch (e) {
    clearTimeout(t);
    return { ok: false, status: 0, body: '', error: e.cause?.code || e.code || e.message };
  }
}

function extractJsUrls(html, baseUrl) {
  const origin = new URL(baseUrl).origin;
  const jsUrls = new Set();
  
  // Script src tags
  const scriptRegex = /<script[^>]*src=["']([^"']+\.(?:js|mjs)[^"']*)["']/gi;
  let m;
  while ((m = scriptRegex.exec(html)) !== null) {
    let url = m[1];
    if (url.startsWith('//')) url = 'https:' + url;
    else if (url.startsWith('/')) url = origin + url;
    else if (!url.startsWith('http')) url = baseUrl.endsWith('/') ? baseUrl + url : baseUrl + '/' + url;
    try { new URL(url); jsUrls.add(url); } catch {}
  }
  
  // Also look for data-main or require.js patterns
  const mainRegex = /data-main=["']([^"']+)["']/gi;
  while ((m = mainRegex.exec(html)) !== null) {
    let url = m[1];
    if (!url.endsWith('.js')) url += '.js';
    if (url.startsWith('/')) url = origin + url;
    try { new URL(url); jsUrls.add(url); } catch {}
  }
  
  return [...jsUrls];
}

function findApiEndpointsInJs(jsContent, baseUrl) {
  const urls = new Set();
  const origin = new URL(baseUrl).origin;
  
  // Look for API endpoint patterns in JS
  const patterns = [
    /["'](https?:\/\/[^"']*(?:\/api\/|\/rest\/|\/gateway\/)[^"']*(?:otp|sms|send|code|register|login|phone|auth)[^"']*)["']/gi,
    /["'](\/[a-zA-Z0-9_\/-]*(?:send-?otp|send-?sms|sms-?send|otp-?send|smsKod|smskod|smsLogin|requestOtp)[a-zA-Z0-9_\/-]*)["']/gi,
    /["'](\/[a-zA-Z0-9_\/-]*(?:member|account|user|customer|auth)[a-zA-Z0-9_\/]*(?:otp|sms|send|code|register|login|phone)[a-zA-Z0-9_\/-]*)["']/gi,
    /["'](\/api\/[a-zA-Z0-9_\/-]*)["']/gi,
    /["'](\/v[0-9]\/[a-zA-Z0-9_\/-]*)["']/gi,
    /["'](\/rest\/[a-zA-Z0-9_\/-]*)["']/gi,
    /["'](https?:\/\/[^"']*\/graphql[^"']*)["']/gi,
    // Also look for axios/fetch calls with relative URLs
    /(?:axios|fetch|ajax)\(["']([^"']+)["']/gi,
    /url:\s*["']([^"']+)["']/gi,
  ];
  
  for (const pattern of patterns) {
    const matches = jsContent.matchAll(pattern);
    for (const match of matches) {
      let path = match[1];
      if (!path.startsWith('http')) {
        if (path.startsWith('//')) path = 'https:' + path;
        else if (path.startsWith('/')) path = origin + path;
        else path = origin + '/' + path;
      }
      try { new URL(path); urls.add(path); } catch {}
    }
  }
  
  return [...urls].filter(u => 
    u.includes('otp') || u.includes('sms') || u.includes('send') || 
    u.includes('code') || u.includes('register') || u.includes('login') ||
    u.includes('phone') || u.includes('auth') || u.includes('member')
  );
}

// Sites with 404 errors - most likely to have working endpoints with correct URL
const targetIds = [
  'zara', 'bershka', 'pull_bear', 'stradivarius',
  'hm', 'mango', 'penti', 'decathlon',
  'rossmann', 'watsons', 'gratis', 'avon', 'oriflame', 'farmasi',
  'mediamarkt', 'vatan_bilgisayar', 'itopya',
  'dr', 'kitapyurdu', 'toyzz_shop', 'alix_avien',
  'starbucks', 'cineverse', 'a101', 'kuryem_gelsin', 'hey_scooter',
  'jimmy_key', 'bkm_kitap', 'amway', 'herbalife',
];

async function main() {
  const results = [];
  
  for (const id of targetIds) {
    const ep = endpoints.find(e => e.id === id);
    if (!ep) continue;
    
    const origin = new URL(ep.url).origin;
    console.log(`\n=== ${ep.name} (${origin}) ===`);
    
    // Fetch homepage
    const page = await fetchWithTimeout(origin);
    if (!page.ok) {
      console.log(`  Page: ❌ ${page.status} ${page.error || ''}`);
      results.push({ id, name: ep.name, pageReachable: false, pageStatus: page.status, jsUrls: [], apiUrls: [] });
      continue;
    }
    console.log(`  Page: ✅ ${page.status} (${page.body.length} bytes)`);
    
    // Extract JS bundle URLs
    const jsUrls = extractJsUrls(page.body, page.finalUrl);
    console.log(`  JS bundles found: ${jsUrls.length}`);
    
    // Fetch each JS bundle and search for API endpoints
    let allApiEndpoints = [];
    for (let i = 0; i < Math.min(jsUrls.length, 5); i++) {
      const jsUrl = jsUrls[i];
      console.log(`  Fetching JS[${i}]: ${jsUrl.substring(0, 80)}`);
      const js = await fetchWithTimeout(jsUrl);
      if (js.ok) {
        const apis = findApiEndpointsInJs(js.body, page.finalUrl);
        allApiEndpoints.push(...apis);
        console.log(`    Found: ${apis.length} potential endpoints`);
        apis.slice(0, 5).forEach(a => console.log(`      ${a}`));
      } else {
        console.log(`    ❌ ${js.status} ${js.error || ''}`);
      }
    }
    
    results.push({ id, name: ep.name, pageReachable: true, pageStatus: page.status, jsUrls, apiUrls: allApiEndpoints.slice(0, 20) });
    
    await new Promise(r => setTimeout(r, 1000));
  }
  
  writeFileSync('js-discovery-results.json', JSON.stringify(results, null, 2));
  
  console.log('\n\n=== SUMMARY ===');
  const withApis = results.filter(r => r.apiUrls.length > 0);
  console.log(`Sites with discoverable APIs in JS: ${withApis.length}/${results.length}`);
  for (const r of withApis) {
    console.log(`\n${r.name}:`);
    r.apiUrls.slice(0, 10).forEach(a => console.log(`  - ${a}`));
  }
}

main().catch(console.error);
