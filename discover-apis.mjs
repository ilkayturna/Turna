import puppeteer from 'puppeteer';

const TARGETS = [
  // === ÖNCELİKLİ: Varolan endpoint'te payload sorunu ===
  { id: 'ido', url: 'https://www.ido.com.tr/uye-ol', isForm: true },
  { id: 'hamidiye', url: 'https://bayi.hamidiye.istanbul', isApp: true },
  { id: 'tasdelen_su', url: 'https://www.tasdelen.com.tr', isApp: true },

  // === POILABS (Alışveriş merkezleri) ===
  { id: 'akasya_avm', url: 'https://www.akasyasite.com', isMall: true },
  { id: 'akbati', url: 'https://www.akbatiavmyasam.com', isMall: true },

  // === BELEDİYELER ===
  { id: 'sancaktepe_belediye', url: 'https://www.sancaktepe.bel.tr', isMunicipal: true },
  { id: 'bayrampasa_belediye', url: 'https://www.bayrampasa.bel.tr', isMunicipal: true },

  // === DİĞER ===
  { id: 'orwi', url: 'https://www.orwi.app', isApp: true },
  { id: 'naosstars', url: 'https://www.naosstars.com', isApp: true },
  { id: 'joker', url: 'https://www.joker.com.tr', isShop: true },
  { id: 'bisu', url: 'https://www.bisu.com.tr', isApp: true },
  { id: 'jimmy_key', url: 'https://www.jimmykey.com', isShop: true },
  { id: 'a101', url: 'https://www.a101.com.tr/kapida', isShop: true },
  { id: 'epic_games', url: 'https://www.epicgames.com', isGame: true },
  { id: 'macrocenter', url: 'https://www.macrocenter.com.tr', isShop: true },
];

const API_PATTERNS = [
  /\/api\//,
  /\/rest\//,
  /\/v[12]\//,
  /\/graphql/,
  /\/otp/,
  /\/send-?[Oo][Tt][Pp]/,
  /\/register/,
  /\/login/,
  /\/signup/,
  /\/sms/,
  /\/auth/,
  /\/member/,
  /\/user/,
  /\/customer/,
  /\/phone/,
  /\/mobile/,
  /\/sms-?[Gg]onder/,
  /verify/,
  /confirmation/,
  /sendCode/,
  /requestOtp/,
  /sendOtp/,
];

const EXCLUDE = [
  /google-analytics/,
  /googletagmanager/,
  /facebook\.com/,
  /doubleclick/,
  /hotjar/,
  /optimize/,
  /cdn-cgi/,
  /challenges/,
  /\.(png|jpg|jpeg|gif|svg|ico|woff2?|ttf|eot|css)$/i,
  /recaptcha/,
  /gstatic\.com/,
  /gtm\.js/,
  /analytics/,
];

async function findEndpointsInJs(jsContent) {
  const found = [];
  for (const pat of API_PATTERNS) {
    const matches = jsContent.match(new RegExp(`["'\`][^"'\`]{10,}${pat.source}[^"'\`]*["'\`]`, 'g'));
    if (matches) {
      for (const m of matches) {
        const cleaned = m.replace(/['"`]/g, '');
        if (!EXCLUDE.some(e => e.test(cleaned)) && !found.includes(cleaned)) {
          found.push(cleaned);
        }
      }
    }
  }
  return found;
}

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security'],
});

const page = await browser.newPage();
page.setDefaultTimeout(15000);

const allRequests = [];
await page.setRequestInterception(true);
page.on('request', req => {
  const url = req.url();
  allRequests.push({ url, method: req.method(), type: req.resourceType(), headers: req.headers(), postData: req.postData() });
  req.continue();
});

for (const target of TARGETS) {
  console.log(`\n========== ${target.id} ==========`);
  console.log(`Navigating to ${target.url}...`);
  allRequests.length = 0;

  try {
    await page.goto(target.url, { waitUntil: 'networkidle0', timeout: 25000 });
    const html = await page.content();

    // Check HTML for API endpoints
    const htmlEndpoints = await findEndpointsInJs(html);

    // Extract form actions
    const formActions = [];
    const formMatches = html.match(/<form[^>]*action=["']([^"']+)["'][^>]*>/gi);
    if (formMatches) {
      for (const f of formMatches) {
        const m = f.match(/action=["']([^"']+)["']/i);
        if (m) formActions.push(m[1]);
      }
    }

    // Extract script URLs
    const scriptUrls = [];
    const scriptMatches = html.match(/<script[^>]*src=["']([^"']+)["'][^>]*>/gi);
    if (scriptMatches) {
      for (const s of scriptMatches) {
        const m = s.match(/src=["']([^"']+)["']/i);
        if (m) scriptUrls.push(m[1]);
      }
    }

    // Select API-like requests from captured traffic
    const apiRequests = allRequests.filter(r => {
      if (EXCLUDE.some(e => e.test(r.url))) return false;
      if (r.type === 'document' || r.type === 'stylesheet' || r.type === 'font') return false;
      return true;
    });

    // Check JavaScript bundles for API URLs
    const jsApiEndpoints = [];
    for (const scriptUrl of scriptUrls.slice(0, 5)) {
      try {
        const fullUrl = scriptUrl.startsWith('http') ? scriptUrl : new URL(scriptUrl, target.url).href;
        const resp = await page.goto(fullUrl, { waitUntil: 'networkidle0', timeout: 8000 });
        const content = await resp.text();
        const found = await findEndpointsInJs(content);
        jsApiEndpoints.push(...found);
      } catch {}
    }

    console.log(`  HTML'de bulunan API endpoint'leri:`);
    for (const ep of htmlEndpoints) console.log(`    ${ep}`);

    if (formActions.length) {
      console.log(`  Form action'ları:`);
      for (const fa of formActions) console.log(`    ${fa}`);
    }

    if (apiRequests.length) {
      console.log(`  Network istekleri (${apiRequests.length}):`);
      for (const r of apiRequests.slice(0, 15)) {
        console.log(`    ${r.method} ${r.url.substring(0, 150)}`);
        if (r.postData) console.log(`      body: ${r.postData.substring(0, 200)}`);
      }
    }

    if (jsApiEndpoints.length) {
      console.log(`  JavaScript bundle'larında bulunan:`);
      for (const ep of [...new Set(jsApiEndpoints)].slice(0, 10)) console.log(`    ${ep}`);
    }
  } catch (err) {
    console.log(`  HATA: ${err.message.substring(0, 100)}`);
  }
}

await browser.close();
console.log('\n========== TAMAMLANDI ==========');
