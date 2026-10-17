// Mass discovery: fetch dead site homepages, find real SMS/OTP API endpoints
import { readFileSync, writeFileSync } from 'fs';

const content = readFileSync('constants.ts', 'utf-8');

// Parse all endpoints from constants.ts manually
const idRegex = /id:\s*'([^']+)'/g;
const nameRegex = /name:\s*'([^']+)'/g;
const urlRegex = /url:\s*'([^']+)'/g;
const methodRegex = /method:\s*'([^']+)'/g;
const statusRegex = /status:\s*'([^']+)'/g;
const payloadRegex = /payloadInfo:\s*'([^']+)'/g;

const ids = [...content.matchAll(idRegex)].map(m => m.index);
const idVals = [...content.matchAll(idRegex)].map(m => m[1]);
const nameVals = [...content.matchAll(nameRegex)].map(m => m[1]);
const urlVals = [...content.matchAll(urlRegex)].map(m => m[1]);
const methodVals = [...content.matchAll(methodRegex)].map(m => m[1]);
const statusVals = [...content.matchAll(statusRegex)].map(m => m[1]);
const payloadVals = [...content.matchAll(payloadRegex)].map(m => m[1]);

const endpoints = idVals.map((id, i) => ({
  id,
  name: nameVals[i] || '',
  url: urlVals[i] || '',
  method: methodVals[i] || 'POST',
  status: statusVals[i] || 'unknown',
  payload: payloadVals[i] || '',
}));

const dead = endpoints.filter(e => e.status === 'dead');
// Deduplicate
const seen = new Set();
const uniqueDead = dead.filter(e => {
  if (seen.has(e.id)) return false;
  seen.add(e.id);
  return true;
});

console.log(`Total: ${endpoints.length}, Dead: ${uniqueDead.length}\n`);

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8',
  'Accept-Encoding': 'gzip, deflate, br',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1',
};

async function fetchWithTimeout(url, timeout = 8000) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), timeout);
  try {
    const r = await fetch(url, { headers: BROWSER_HEADERS, signal: c.signal, redirect: 'follow' });
    clearTimeout(t);
    return { ok: r.ok || r.status < 400, status: r.status, body: await r.text(), finalUrl: r.url };
  } catch (e) {
    clearTimeout(t);
    return { ok: false, status: 0, body: '', error: e.cause?.code || e.code || e.message };
  }
}

// Pattern: find API-like URLs in HTML/JS
function findApiUrls(html, baseUrl) {
  const results = new Set();
  const patterns = [
    /["']([^"']*(?:\/api\/|\/rest\/|\/gateway\/|\/v[1-9]\/|\/v[1-9]\.[0-9]\/)[^"']*(?:otp|sms|send|code|register|login|phone|mobile|auth)[^"']*)["']/gi,
    /["'](\/[a-zA-Z0-9_\/-]*(?:send-?otp|send-?sms|sms-?send|otp-?send|smsGonder|smskod|smsKod)[a-zA-Z0-9_\/-]*)["']/gi,
    /["'](\/[a-zA-Z0-9_\/-]*(?:member|account|user|customer|auth)[a-zA-Z0-9_\/]*(?:otp|sms|send|code|register|login)[a-zA-Z0-9_\/-]*)["']/gi,
    // Look for JS fetch/XHR calls
    /["']([^"']+(?:sendOtp|sendOtpCode|sendOtpSms|requestOtp|smsLogin|smslogin|otpLogin)[^"']*)["']/gi,
    /["']([^"']+(?:sms|otp)\/[a-zA-Z0-9_-]+[^"']*)["']/gi,
  ];
  for (const pat of patterns) {
    const matches = html.matchAll(pat);
    for (const m of matches) {
      let path = m[1];
      if (path.startsWith('//')) path = 'https:' + path;
      else if (path.startsWith('/')) path = new URL(baseUrl).origin + path;
      else if (!path.startsWith('http')) path = new URL(baseUrl).origin + '/' + path;
      try {
        new URL(path);
        results.add(path);
      } catch {}
    }
  }
  return [...results];
}

// Known working path patterns to try as alternatives
const ALT_PATHS = [
  '/api/v1/auth/register/send-otp',
  '/api/v1/auth/register/sendOtp',
  '/api/v1/otp/send',
  '/api/v1/auth/otp/send',
  '/api/v1/auth/register/otp',
  '/users/register/',
  '/api/auth/register/sendOtp',
  '/api/member/register/sendOtp',
  '/api/member/sendOtp',
  '/api/customer/sendOtpCode',
  '/rest/user-edge/auth/login/otp',
  '/api/account/register/otp',
  '/api/v2/auth/otp/send',
  '/users/otp-login/',
];

function generateAltUrls(endpoint) {
  const origin = new URL(endpoint.url).origin;
  const results = [];
  for (const p of ALT_PATHS) {
    const u = origin + p;
    if (u !== endpoint.url) results.push(u);
  }
  // Also try subdomain variants
  const hostname = new URL(endpoint.url).hostname;
  if (hostname.startsWith('www.')) {
    const noWww = hostname.substring(4);
    for (const p of ALT_PATHS.slice(0, 5)) {
      results.push(`https://${noWww}` + p);
    }
  } else {
    for (const p of ALT_PATHS.slice(0, 5)) {
      results.push(`https://www.${hostname}` + p);
    }
  }
  return results;
}

async function main() {
  const results = [];

  for (let i = 0; i < uniqueDead.length; i++) {
    const ep = uniqueDead[i];
    const origin = new URL(ep.url).origin;
    const result = {
      id: ep.id,
      name: ep.name,
      url: ep.url,
      pageReachable: false,
      pageStatus: 0,
      pageError: '',
      discoveredApis: [],
      alternativeUrls: [],
      workingUrl: '',
    };

    // Try fetching the homepage
    const page = await fetchWithTimeout(origin);
    result.pageReachable = page.ok;
    result.pageStatus = page.status;

    if (page.ok) {
      const apis = findApiUrls(page.body, page.finalUrl);
      result.discoveredApis = apis.slice(0, 5);
    } else {
      result.pageError = page.error || String(page.status);
    }

    // Generate alternative URLs
    result.alternativeUrls = generateAltUrls(ep);

    // Output
    const status = result.pageReachable ? `${result.pageStatus}` : `❌${result.pageError}`;
    const discovered = result.discoveredApis.length > 0 ? ` [${result.discoveredApis.length} API]` : '';
    console.log(`${result.pageReachable ? '✅' : '❌'} ${ep.name.padEnd(20)} HTTP ${status.padEnd(15)}${discovered}`);

    if (result.discoveredApis.length > 0) {
      result.discoveredApis.slice(0, 2).forEach(a => console.log(`   └─ ${a}`));
    }

    results.push(result);

    // Rate limit: 500ms between requests
    if (i < uniqueDead.length - 1) await new Promise(r => setTimeout(r, 500));
  }

  // Summary
  const reachable = results.filter(r => r.pageReachable);
  const withApis = results.filter(r => r.discoveredApis.length > 0);
  console.log(`\n\n=== SUMMARY ===`);
  console.log(`Reachable pages: ${reachable.length}/${results.length}`);
  console.log(`Pages with discoverable APIs: ${withApis.length}/${results.length}`);

  if (withApis.length > 0) {
    console.log(`\nSites with discovered API endpoints:`);
    for (const r of withApis) {
      console.log(`\n${r.name} (${r.url})`);
      r.discoveredApis.forEach(a => console.log(`  - ${a}`));
      console.log(`  Alternative paths to try:`);
      r.alternativeUrls.slice(0, 5).forEach(a => console.log(`  - ${a}`));
    }
  }

  writeFileSync('mass-discovery-results.json', JSON.stringify(results, null, 2));
  console.log('\nResults saved to mass-discovery-results.json');
}

main().catch(console.error);
