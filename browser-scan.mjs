// Scan JS bundles for SMS/OTP API endpoints using user's Chrome
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const USER_DATA_DIR = 'C:\\Users\\ilkay.turna\\AppData\\Local\\Google\\Chrome\\User Data';
const PHONE = '5343622375';
const TEMP_PROFILE = mkdtempSync(join(tmpdir(), 'turna-scan-'));

// All sites to visit (homepage to find register page, then scan JS)
const SITES = [
  // Limited ones (need better payload/headers)
  { id: 'onur_market', url: 'https://www.onurmarket.com', name: 'Onur Market' },
  { id: 'e_bebek', url: 'https://www.e-bebek.com', name: 'E-bebek' },
  { id: 'bkm_express', url: 'https://www.bkmexpress.com.tr', name: 'BKM Express' },
  { id: 'shopandfly', url: 'https://www.shopandfly.com.tr', name: 'Shop&Fly' },
  { id: 'teb', url: 'https://www.teb.com.tr', name: 'TEB' },
  { id: 'kfc', url: 'https://www.kfc.com.tr', name: 'KFC' },
  { id: 'sportive', url: 'https://www.sportive.com.tr', name: 'Sportive' },
  { id: 'oldubil', url: 'https://www.oldubil.com', name: 'Oldubil' },
  { id: 'lcwaikiki', url: 'https://www.lcwaikiki.com.tr', name: 'LC Waikiki' },
  { id: 'bambi', url: 'https://www.bambi.com.tr', name: 'Bambi' },
  { id: 'english_home', url: 'https://www.englishhome.com', name: 'English Home' },
  { id: 'wmf', url: 'https://www.wmf.com.tr', name: 'WMF' },
  { id: 'ayyildiz', url: 'https://www.altinyildizclassics.com', name: 'Ayyildiz' },
  { id: 'intersport', url: 'https://www.intersport.com.tr', name: 'Intersport' },
  { id: 'massimo_dutti', url: 'https://www.massimodutti.com/tr/', name: 'Massimo Dutti' },
  { id: 'happy_center', url: 'https://www.happycenter.com.tr', name: 'Happy Center' },
  { id: 'bim', url: 'https://www.bim.com.tr', name: 'BIM' },
  { id: 'lr', url: 'https://www.lrworld.com/tr/', name: 'LR' },
  // Dead ones that had SMS
  { id: 'hayat_su', url: 'https://www.hayatsu.com.tr', name: 'Hayat Su' },
  { id: 'steam', url: 'https://store.steampowered.com', name: 'Steam' },
  { id: 'flormar', url: 'https://www.flormar.com.tr', name: 'Flormar' },
  { id: 'evidea', url: 'https://www.evidea.com', name: 'Evidea' },
  { id: 'komagene', url: 'https://www.komagene.com.tr', name: 'Komagene' },
];

const foundApis = [];

async function scanSiteJs(page, site, registerUrl) {
  const apis = new Set();
  
  console.log(`\n=== ${site.name} ===`);

  try {
    // Navigate to registration page
    console.log(`  Navigating to: ${registerUrl.substring(0, 80)}`);
    await page.goto(registerUrl, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(3000);

    // Get all JS bundle URLs from the page
    const jsUrls = await page.evaluate(() => {
      const urls = new Set();
      document.querySelectorAll('script[src]').forEach(s => {
        if (s.src && s.src.match(/\.(js|mjs)\b/)) urls.add(s.src);
      });
      // Also look for inline scripts with import()
      document.querySelectorAll('script:not([src])').forEach(s => {
        const text = s.textContent || '';
        // Find dynamic imports
        const imports = text.match(/import\(['"]([^'"]+\.(?:js|mjs)[^'"]*)['"]\)/g);
        if (imports) imports.forEach(i => url.add(i.replace(/import\(['"]/, '').replace(/['"]\)/, '')));
      });
      return [...urls];
    });

    console.log(`  Found ${jsUrls.length} JS bundles`);

    // Download and scan each bundle
    for (const jsUrl of jsUrls.slice(0, 8)) {
      try {
        const res = await page.request.get(jsUrl, { timeout: 10000 });
        const js = await res.text();
        
        // Find API URLs in JS
        const patterns = [
          /["']((?:https?:)?\/\/[^"']*\/api\/[^"']*(?:otp|sms|send|register|kayit|signup|auth|member|user)[^"']*)["']/gi,
          /["']((?:https?:)?\/\/[^"']*(?:otp|sms|sendOtp|send-otp|send_otp|kayit|uye-ol|signup|register)[^"']*)["']/gi,
          /fetch\(["']([^"']+)["']/g,
          /axios\.(?:get|post|put)\(["']([^"']+)["']/g,
          /ajax\(["']([^"']+)["']/g,
          /\$\$?\.[^)]*\(["']([^"']+)["']/g,
          /url:\s*["']([^"']+\/api\/[^"']+)["']/g,
        ];

        for (const pattern of patterns) {
          const matches = js.match(pattern);
          if (matches) {
            for (const match of matches) {
              // Extract the URL part
              let url = match;
              // Remove the regex wrapper
              url = url.replace(/^["']/, '').replace(/["']$/, '');
              // Remove fetch(, axios.get( etc prefixes
              url = url.replace(/^fetch\(/, '').replace(/^axios\.(?:get|post|put)\(/, '').replace(/^ajax\(/, '').replace(/^url:\s*/, '');
              url = url.replace(/["']$/, '').replace(/^["']/, '');
              url = url.replace(/\\\//g, '/');
              
              // Resolve relative URLs
              if (url.startsWith('//')) {
                url = 'https:' + url;
              } else if (url.startsWith('/')) {
                try { url = new URL(url, site.url).href; } catch {}
              } else if (!url.startsWith('http')) {
                continue;
              }
              
              apis.add(url);
            }
          }
        }
      } catch (e) {
        // Skip if bundle can't be loaded
      }
    }

    // Also try to find the SMS API by submitting the phone form
    const phoneSelectors = [
      'input[type="tel"]', 'input[name*="phone"]', 'input[name*="tel"]', 
      'input[name*="gsm"]', 'input[name*="cep"]', 'input[name*="mobile"]',
      'input[placeholder*="telefon"]', 'input[placeholder*="cep"]',
      'input[id*="phone"]', 'input[id*="telefon"]',
    ];

    for (const sel of phoneSelectors) {
      const el = page.locator(sel).first();
      if (await el.isVisible().catch(() => false)) {
        console.log(`  Found phone input: ${sel}`);
        await el.click();
        await page.waitForTimeout(200);
        await el.fill(`5${PHONE}`);
        await page.waitForTimeout(500);

        // Try SMS button
        for (const btnText of ['SMS', 'Kod', 'Devam', 'Gönder', 'OTP', 'Doğrula', 'Kayıt Ol', 'Üye Ol', 'Giriş']) {
          try {
            const btn = page.locator(`button:has-text("${btnText}"), a:has-text("${btnText}"), input[value*="${btnText}"]`).first();
            if (await btn.isVisible().catch(() => false)) {
              await btn.click();
              console.log(`  Clicked "${btnText}" button`);
              await page.waitForTimeout(3000);
              break;
            }
          } catch {}
        }
        break;
      }
    }

  } catch (e) {
    console.log(`  Error: ${e.message.substring(0, 100)}`);
  }

  return apis;
}

async function main() {
  console.log('Launching Chrome...');
  
  return await chromium.launchPersistentContext(TEMP_PROFILE, {
    executablePath: CHROME_PATH,
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-web-security',
    ],
    viewport: { width: 1280, height: 800 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    locale: 'tr-TR',
    timezoneId: 'Europe/Istanbul',
  }).then(async (context) => {
    const page = await context.newPage();
    
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    });

    // Monitor network requests
    const allRequests = new Set();
    page.on('request', req => {
      const url = req.url();
      if (!url.includes('.css') && !url.includes('.png') && !url.includes('.jpg') && 
          !url.includes('.woff') && !url.includes('.ico') && !url.includes('.svg')) {
        if (url.includes('/api/') || url.includes('otp') || url.includes('sms') || 
            url.includes('send') || url.includes('register') || url.includes('auth')) {
          allRequests.add(`${req.method()} ${url}`);
        }
      }
    });

    for (const site of SITES) {
      // First go to homepage, find register link
      try {
        await page.goto(site.url, { waitUntil: 'networkidle', timeout: 20000 });
        await page.waitForTimeout(2000);
      } catch {
        try { await page.goto(site.url, { timeout: 10000 }); } catch {}
      }

      // Find register URL
      let registerUrl = site.url;
      const links = await page.evaluate(() => {
        const allUrls = [];
        document.querySelectorAll('a').forEach(a => {
          const href = a.href || '';
          const text = (a.textContent || '').toLowerCase().trim().substring(0, 30);
          if (href && (text.includes('uye ol') || text.includes('kayit') || text.includes('üye ol') || text.includes('sign up') || text.includes('register') || text.includes('hesap oluştur'))) {
            if (href !== '#' && !href.startsWith('javascript:')) allUrls.push(href);
          }
        });
        return allUrls.slice(0, 3);
      });

      if (links.length > 0) {
        registerUrl = links[0];
      } else {
        // Try common paths
        for (const path of ['/uye-ol', '/kayit-ol', '/register', '/signup', '/users/auth/register', '/auth/register', '/giris-yap']) {
          try {
            await page.goto(site.url.replace(/\/+$/, '') + path, { waitUntil: 'domcontentloaded', timeout: 8000 });
            await page.waitForTimeout(1000);
            registerUrl = page.url();
            break;
          } catch {}
        }
      }

      const apis = await scanSiteJs(page, site, registerUrl);
      
      // Filter for interesting APIs
      const interesting = [...apis].filter(u => 
        u.includes('/api/') || u.includes('otp') || u.includes('sms') || 
        u.includes('send') || u.includes('register') || u.includes('kayit')
      );

      console.log(`  Found ${interesting.length} interesting API URLs:`);
      interesting.forEach(u => console.log(`    ${u.substring(0, 120)}`));

      foundApis.push({ site: site.name, url: site.url, registerUrl, apis: interesting, allRequests: [...allRequests] });
      
      // Clear request log for next site
      allRequests.clear();
    }

    await context.close();

    // Save results
    writeFileSync('browser-scan-results.json', JSON.stringify(foundApis, null, 2));
    
    console.log('\n\n=== ALL DISCOVERED API ENDPOINTS ===');
    let total = 0;
    for (const r of foundApis) {
      if (r.apis.length > 0) {
        console.log(`\n${r.site} (${r.registerUrl}):`);
        r.apis.forEach(a => { console.log(`  ${a}`); total++; });
      }
      if (r.allRequests.length > 0) {
        console.log(`  Network requests:`);
        r.allRequests.forEach(a => console.log(`    ${a}`));
      }
    }
    console.log(`\nTotal: ${total} new endpoints`);
  });
}

main().catch(e => {
  console.error('Fatal:', e?.message || e);
  process.exit(1);
});
