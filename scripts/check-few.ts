import { executeRequest, buildRotatingHeaders, isHtmlBody } from '../services/proxy-core';

const tests = [
  { name: 'E-bebek', url: 'https://www.e-bebek.com/api/v1/auth/register/send-otp', method: 'POST', payload: { phone: '5551234567', email: 'test@test.com' } },
  { name: 'KFC', url: 'https://www.kfc.com.tr/api/v1/auth/register/send-otp', method: 'POST', payload: { phone: '5551234567' } },
  { name: 'Sportive (GET)', url: 'https://www.sportive.com.tr/api/v1/auth/register/send-otp', method: 'GET', payload: {} },
  { name: 'Ayyildiz', url: 'https://api.altinyildizclassics.com/mobileapi2/autapi/CreateSmsOtpForRegister', method: 'POST',
    payload: { gsm: '5551234567' },
    headers: { Token: 'MXZ5NTJ82WXBUJB7KBP10AGR3AF6S4GB95VZDU4G44JFEIN3WISAC2KLRIBNONQ7QVCZXM3ZHI661AMVXLKJLF9HUKI5SQ2ROMZS', Devicetype: 'mobileapp', AppVersion: '2.0.0', Platform: 'Android' } },
];

(async () => {
  for (const t of tests) {
    console.log('\n--- ' + t.name + ' ---');
    const h = t.headers ? { ...buildRotatingHeaders(new URL(t.url).origin), ...t.headers } : buildRotatingHeaders(new URL(t.url).origin);
    const r = await executeRequest(t.url, t.method, t.payload, h, 15000);
    const dataStr = typeof r.data === 'string' ? r.data.substring(0, 300) : JSON.stringify(r.data).substring(0, 300);
    console.log('Status:', r.status, '| Success:', r.success, '| isHTML:', typeof r.data === 'string' && isHtmlBody(r.data));
    console.log('Data:', dataStr);
  }
})();
