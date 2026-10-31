// Quick Puppeteer scan of top 5 sites to find SMS API endpoints
import puppeteer from 'puppeteer';
import { writeFileSync } from 'fs';

const sites = [
  { id: 'rossmann', name: 'Rossmann', url: 'https://www.rossmann.com.tr/kayit-ol' },
  { id: 'decathlon', name: 'Decathlon', url: 'https://www.decathlon.com.tr/register' },
  { id: 'mediamarkt', name: 'MediaMarkt', url: 'https://www.mediamarkt.com.tr/register' },
  { id: 'penti', name: 'Penti', url: 'https://www.penti.com/uye-kayit' },
  { id: 'a101', name: 'A101', url: 'https://www.a101.com.tr/users/otp-login/' },
];

const browser = await puppeteer.launch({
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled'],
});

const results = [];

for (const site of sites) {
  console.log(`\n=== ${site.name} (${site.url}) ===`);
  const page = await browser.newPage();

  // Collect all XHR/fetch requests
  const requests = [];

  page.on('request', req => {
    if (req.resourceType() === 'xhr' || req.resourceType() === 'fetch') {
      if (req.url().match(/otp|sms|send|code|register|login|phone|auth/i)) {
        requests.push({
          url: req.url(),
          method: req.method(),
          postData: req.postData(),
          headers: req.headers(),
        });
      }
    }
  });

  try {
    await page.goto(site.url, { waitUntil: 'networkidle2', timeout: 20000 });
    await new Promise(r => setTimeout(r, 2000));

    // Try to find and fill phone input
    const input = await page.$(
      'input[type="tel"], input[name*="phone"], input[name*="tel"], input[name*="cep"], input[name*="mobile"], input[inputmode="numeric"]',
    );
    if (input) {
      await input.click({ clickCount: 3 });
      await input.type('5321111111', { delay: 30 });
      await new Promise(r => setTimeout(r, 500));

      // Try clicking any button containing SMS/Kod/Gönder text
      const btn = await page.$(
        'button:has-text("Kod"), button:has-text("Gönder"), button:has-text("GONDER"), button:has-text("Onay"), button[type="submit"]',
      );
      if (btn) {
        await btn.click();
        await new Promise(r => setTimeout(r, 3000));
      }
    }

    // Report findings
    if (requests.length > 0) {
      console.log(`  Found ${requests.length} API calls:`);
      for (const r of requests) {
        console.log(`    ${r.method} ${r.url}`);
        if (r.postData) console.log(`      Body: ${r.postData.substring(0, 300)}`);
      }
    } else {
      console.log(`  No API calls found`);
    }

    results.push({ id: site.id, name: site.name, requests });
  } catch (err) {
    console.log(`  ❌ ${err.message}`);
    results.push({ id: site.id, name: site.name, error: err.message });
  }

  await page.close();
  writeFileSync('puppeteer-results.json', JSON.stringify(results, null, 2));
}

await browser.close();
console.log('\nDone!');
