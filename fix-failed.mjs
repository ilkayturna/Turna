// Retry only the failed endpoints with fixed payloads/emails
const PHONE = '5343622375';

function buildHeaders() {
  const agents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  ];
  return {
    'User-Agent': agents[Math.floor(Math.random() * agents.length)],
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8',
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
    'Origin': 'https://www.google.com',
    'Referer': 'https://www.google.com/',
    'Sec-Fetch-Site': 'cross-site',
  };
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
function rdelay() { return delay(1000 + Math.random() * 2000); }

// Fix 1: Sportive - GET method
async function fixSportive() {
  console.log('\n=== Sportive (GET fix) ===');
  // Try with unique email as query param
  const email = 'sportive_test@mailtest.com';
  const url = `https://www.sportive.com.tr/api/v1/auth/register/send-otp`;
  const r = await fetch(url, {
    method: 'GET',
    headers: {
      ...buildHeaders(),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  console.log(`  GET: ${r.status} ${r.ok ? '✅' : '❌'}`);
  const body = await r.text().catch(() => '');
  console.log(`  Body: ${body.substring(0, 100)}`);
  return r.ok ? { name: 'Sportive', url, ok: true, status: r.status } : null;
}

// Fix 2: Koton - use unique email
async function fixKoton() {
  console.log('\n=== Koton (unique email) ===');
  const email = 'koton_xyz@mailtest.com';
  const r = await fetch('https://www.koton.com/users/register/', {
    method: 'POST',
    headers: { ...buildHeaders(), 'X-App-Type': 'akinon-mobile' },
    body: JSON.stringify({ phone: PHONE, first_name: 'Test', last_name: 'User', email, password: 'Test123!' }),
  });
  console.log(`  POST: ${r.status} ${r.ok ? '✅' : '❌'}`);
  const body = await r.text().catch(() => '');
  console.log(`  Body: ${body.substring(0, 150)}`);
  return r.ok ? { name: 'Koton', url: 'https://www.koton.com/users/register/', ok: true, status: r.status } : null;
}

// Fix 3: Flormar - use real-looking email
async function fixFlormar() {
  console.log('\n=== Flormar (real email) ===');
  const email = 'ali.yilmaz.flormar@windowslive.com';
  const r = await fetch('https://www.flormar.com.tr/users/register/', {
    method: 'POST',
    headers: { ...buildHeaders(), 'X-App-Type': 'akinon-mobile' },
    body: JSON.stringify({ phone: `0${PHONE}`, first_name: 'Ali', last_name: 'Yılmaz', email, password: 'Test123!' }),
  });
  console.log(`  POST: ${r.status} ${r.ok ? '✅' : '❌'}`);
  const body = await r.text().catch(() => '');
  console.log(`  Body: ${body.substring(0, 150)}`);
  return r.ok ? { name: 'Flormar', url: 'https://www.flormar.com.tr/users/register/', ok: true, status: r.status } : null;
}

// Fix 4: Evidea - add confirm, 0-leading phone, real email
async function fixEvidea() {
  console.log('\n=== Evidea (confirm + 0 phone + real email) ===');
  const email = 'mehmet.demir.evidea@outlook.com';
  const r = await fetch('https://www.evidea.com/users/register/', {
    method: 'POST',
    headers: { ...buildHeaders(), 'X-App-Type': 'akinon-mobile' },
    body: JSON.stringify({ phone: `0${PHONE}`, first_name: 'Mehmet', last_name: 'Demir', email, password: 'Test123!', confirm: true }),
  });
  console.log(`  POST: ${r.status} ${r.ok ? '✅' : '❌'}`);
  const body = await r.text().catch(() => '');
  console.log(`  Body: ${body.substring(0, 150)}`);
  return r.ok ? { name: 'Evidea', url: 'https://www.evidea.com/users/register/', ok: true, status: r.status } : null;
}

// Fix 5: Dominos - unique email
async function fixDominos() {
  console.log('\n=== Dominos (unique email) ===');
  const email = 'dominos_test@mailtest.com';
  const r = await fetch('https://frontend.dominos.com.tr:443/api/customer/sendOtpCode', {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify({ email, isSure: false, mobilePhone: PHONE }),
  });
  console.log(`  POST: ${r.status} ${r.ok ? '✅' : '❌'}`);
  const body = await r.text().catch(() => '');
  console.log(`  Body: ${body.substring(0, 150)}`);
  return r.ok ? { name: 'Dominos', url: 'https://frontend.dominos.com.tr:443/api/customer/sendOtpCode', ok: true, status: r.status } : null;
}

// Fix 6: Bambi - try via proxy (Cloudflare)
async function fixBambi() {
  console.log('\n=== Bambi (via proxy) ===');
  try {
    const r = await fetch('http://localhost:3001/api/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serviceId: 'bambi',
        serviceUrl: 'https://www.bambi.com.tr/api/v1/auth/register/send-otp',
        serviceMethod: 'POST',
        targetPhone: PHONE,
        email: 'bambi_test@mailtest.com',
        initialPayload: { phone: PHONE },
        allowAiHealing: true,
      }),
    });
    const data = await r.json();
    console.log(`  Proxy: ${JSON.stringify(data).substring(0, 150)}`);
    return data.ok ? { name: 'Bambi', url: 'https://www.bambi.com.tr/api/v1/auth/register/send-otp', ok: true, status: data.upstreamStatus } : null;
  } catch (e) {
    console.log(`  ❌ ${e.message}`);
    return null;
  }
}

async function main() {
  console.log('Retrying 6 failed endpoints with fixes...\n');

  const results = [];

  // Try each with delays
  results.push(await fixSportive()); await rdelay();
  results.push(await fixKoton()); await rdelay();
  results.push(await fixFlormar()); await rdelay();
  results.push(await fixEvidea()); await rdelay();
  results.push(await fixDominos()); await rdelay();
  results.push(await fixBambi());

  const fixed = results.filter(Boolean);
  console.log(`\n${'='.repeat(50)}`);
  console.log(`Fixed: ${fixed.length}/6`);
  fixed.forEach(r => console.log(`  ✅ ${r.name} (HTTP ${r.status})`));
}

main().catch(console.error);
