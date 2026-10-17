// Try different approaches for Flormar
const PHONE = '5343622375';
const AGENT = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Content-Type': 'application/json',
  'X-App-Type': 'akinon-mobile',
};

async function t(url, body) {
  const r = await fetch(url, { method: 'POST', headers: AGENT, body: JSON.stringify(body) });
  const text = await r.text();
  console.log(`  ${r.status} ${JSON.stringify(body).substring(0, 80)} => ${text.substring(0, 120)}`);
  return r.ok;
}

// Try email with random timestamp
const ts = Date.now();
const bodies = [
  { phone: `0${PHONE}`, email: `flormar${ts}@example.com`, password: 'Test123!', first_name: 'Ali', last_name: 'Yılmaz' },
  { phone: `0${PHONE}`, email: `flormar${ts}@mail.com`, password: 'Test123!' },
  { phone: PHONE, email: `flormar${ts}@gmail.com`, password: 'Test123!', first_name: 'A', last_name: 'Y' },
  { phone: `0${PHONE}` },
  { phone: PHONE },
  { phone: `+90${PHONE}` },
  { mobilePhone: PHONE },
  { msisdn: PHONE },
  { telephone: `+90${PHONE}` },
];

console.log('Testing Flormar alternatives...');
for (const b of bodies) {
  if (await t('https://www.flormar.com.tr/users/register/', b)) {
    console.log('  ✅ FOUND WORKING PAYLOAD!');
    break;
  }
}
