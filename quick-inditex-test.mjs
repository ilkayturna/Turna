// Test Inditex brands with common path patterns
const sites = {
  Zara: 'https://www.zara.com/tr',
  Bershka: 'https://www.bershka.com/tr',
  'Pull&Bear': 'https://www.pullandbear.com/tr',
  Stradivarius: 'https://www.stradivarius.com/tr',
};

const paths = [
  '/api/auth/register/sendOtp',
  '/api/auth/register/send-otp',
  '/api/v1/auth/register/sendOtp',
  '/api/v1/auth/register/send-otp',
  '/api/auth/otp/send',
  '/api/account/register/otp',
  '/api/customer/sendOtpCode',
  '/api/v2/auth/register/sendOtp',
];

async function test(url) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 5000);
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '+905321111111' }),
      signal: c.signal,
    });
    clearTimeout(t);
    const isWorking = r.ok || r.status === 202 || r.status === 201 || r.status === 429;
    return isWorking ? ['OK', r.status] : [null, r.status];
  } catch (e) {
    clearTimeout(t);
    return [null, e.cause?.code || e.code || e.message || 'ERR'];
  }
}

(async () => {
  for (const [name, base] of Object.entries(sites)) {
    console.log(`\n--- ${name} ---`);
    for (const p of paths) {
      const url = base + p;
      const [ok, status] = await test(url);
      const icon = ok === 'OK' ? '✅' : '❌';
      console.log(`  ${icon} ${String(status).padEnd(8)} ${p}`);
    }
  }
})().catch(console.error);
