// Check Flormar registration page
const r = await fetch('https://www.flormar.com.tr/uye-kayit', {
  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
});
const html = await r.text();
console.log('Status:', r.status);

// Look for form action
const formActions = html.match(/action="[^"]+"/g);
console.log('Form actions:', formActions?.slice(0, 5));

// Look for API URLs
const apiUrls = html.match(/\/api\/[^"']+/g);
console.log('API URLs:', apiUrls?.slice(0, 10));

// Look for fetch/ajax
const fetchCalls = html.match(/fetch\(["'][^"']+["']/g);
console.log('Fetch calls:', fetchCalls?.slice(0, 10));

// Print page title
const title = html.match(/<title>([^<]+)<\/title>/);
console.log('Title:', title?.[1]);

// Look for register URL
const registerLinks = html.match(/href="[^"]*(?:kayit|kayıt|register|uye)[^"]*"/gi);
console.log('Register URLs:', registerLinks?.slice(0, 5));
