import { executeRequest, buildRotatingHeaders, isHtmlBody } from '../services/proxy-core';

const tests = [
  {
    name: 'Ayyildiz v2',
    url: 'https://www.ayyildiz.com/api/member/register/sendOtp',
    method: 'POST',
    payload: { gsm: '5551234567' },
    headers: {},
  },
  {
    name: 'Ayyildiz v3',
    url: 'https://www.ayyildiz.com/api/v1/auth/register/sendOtp',
    method: 'POST',
    payload: { phone: '5551234567' },
    headers: {},
  },
  {
    name: 'Sportive POST (test)',
    url: 'https://www.sportive.com.tr/api/auth/register/send-otp',
    method: 'POST',
    payload: { phone: '5551234567' },
    headers: {},
  },
  {
    name: 'Sportive v2',
    url: 'https://www.sportive.com.tr/api/member/sendOtp',
    method: 'POST',
    payload: { phone: '5551234567' },
    headers: {},
  },
  {
    name: 'LR v2',
    url: 'https://neo.lrworld.com/api/v1/auth/register/send-otp',
    method: 'POST',
    payload: { phone: '+905551234567', country: 'TR' },
    headers: {},
  },
  {
    name: 'Onur Market CSRF',
    url: 'https://www.onurmarket.com/api/v1/auth/register/sendOtp',
    method: 'POST',
    payload: { phone: '5551234567' },
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-Requested-With': 'XMLHttpRequest' },
  },
  {
    name: 'E-bebek CSRF',
    url: 'https://www.e-bebek.com/api/v1/auth/register/send-otp',
    method: 'POST',
    payload: 'phone=5551234567&email=test@test.com',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-Requested-With': 'XMLHttpRequest' },
  },
  {
    name: 'Oldubil v2',
    url: 'https://api.oldubil.com/api/v2/auth/send-otp',
    method: 'POST',
    payload: { phone: '5551234567' },
    headers: {},
  },
];

(async () => {
  for (const t of tests) {
    console.log('\n--- ' + t.name + ' ---');
    const h = t.headers ? { ...buildRotatingHeaders(new URL(t.url).origin), ...t.headers } : buildRotatingHeaders(new URL(t.url).origin);
    try {
      const r = await executeRequest(t.url, t.method, t.payload, h, 15000);
      const dataStr = typeof r.data === 'string' ? r.data.substring(0, 200) : JSON.stringify(r.data).substring(0, 200);
      console.log('Status:', r.status, '| Success:', r.success);
      console.log('Data:', dataStr);
    } catch (e: any) {
      console.log('Error:', e.message);
    }
  }
})();
