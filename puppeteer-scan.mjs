// Scan a single site with Puppeteer to find SMS API
import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({
  headless: false,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

const page = await browser.newPage();
await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36');

// Log ALL requests
const allRequests = [];
page.on('request', req => {
  allRequests.push({ url: req.url(), method: req.method(), type: req.resourceType() });
});

// Try Decathlon first
const targetUrl = 'https://www.decathlon.com.tr/register';
console.log(`Opening: ${targetUrl}`);

try {
  const resp = await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
  console.log(`Status: ${resp?.status()}`);
  console.log(`Title: ${await page.title()}`);
  console.log(`URL: ${await page.url()}`);

  await new Promise(r => setTimeout(r, 3000));

  // Print page info
  const info = await page.evaluate(() => ({
    inputs: [...document.querySelectorAll('input')].map(i => ({ type: i.type, name: i.name, placeholder: i.placeholder, id: i.id })),
    buttons: [...document.querySelectorAll('button, input[type="submit"]')].map(b => ({
      text: b.innerText?.substring(0, 50) || b.value,
      type: b.type,
    })),
    forms: document.forms.length,
  }));

  console.log('\nInputs:', JSON.stringify(info.inputs, null, 2));
  console.log('\nButtons:', JSON.stringify(info.buttons, null, 2));

  // Filter API calls
  const apiCalls = allRequests.filter(
    r => r.url.includes('/api/') || r.url.includes('/rest/') || r.url.includes('/auth/') || r.url.includes('/graphql'),
  );
  console.log(`\nAPI calls: ${apiCalls.length}`);
  apiCalls.forEach(a => console.log(`  ${a.method} ${a.url.substring(0, 120)}`));
} catch (err) {
  console.log(`Error: ${err.message}`);
}

await browser.close();
