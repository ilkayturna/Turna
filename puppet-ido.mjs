import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
const page = await browser.newPage();
page.setDefaultTimeout(20000);
const allReqs = [];
await page.setRequestInterception(true);
page.on('request', req => {
  if (req.method() === 'POST' || req.url().includes('ido') || req.url().includes('api')) {
    allReqs.push({ url: req.url(), method: req.method(), postData: req.postData(), type: req.resourceType() });
  }
  req.continue();
});

try {
  await page.goto('https://www.ido.com.tr/uye-ol', { waitUntil: 'networkidle0', timeout: 25000 });
  const html = await page.content();
  console.log('Page loaded, length:', html.length);

  const inputs = html.match(/<input[^>]*>/gi) || [];
  console.log('Form inputs:', inputs.length);
  for (const inp of inputs.slice(0, 30)) {
    const m = inp.match(/name="([^"]+)"/i);
    const t = inp.match(/type="([^"]+)"/i);
    if (m || t) console.log('  ' + (m?.[1] || '') + ' (' + (t?.[1] || '') + ')');
  }

  // Check for API endpoints in HTML
  const apis = html.match(/\/idows\/[^"']+/g) || [];
  if (apis.length) console.log('API paths:', [...new Set(apis)]);
} catch (e) {
  console.log('Error:', e.message.substring(0, 100));
}

console.log('\nNetwork requests to IDO API:');
for (const r of allReqs) {
  console.log('  ' + r.method + ' ' + r.url.substring(0, 150));
  if (r.postData) console.log('    body: ' + r.postData.substring(0, 200));
}

await browser.close();
