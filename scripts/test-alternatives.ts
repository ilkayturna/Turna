import { buildRotatingHeaders, executeRequest } from '../services/proxy-core';
import * as fs from 'fs';
import * as path from 'path';

const TEST_PHONE = '5551234567';
const TEST_EMAIL = 'test.user@example.com';

interface AltEndpoint {
  name: string;
  urls: { url: string; payload: any; method: string; headers?: Record<string, string> }[];
}

const alternatives: AltEndpoint[] = [
  {
    name: 'LR',
    urls: [
      { url: 'https://www.lrworld.com/api/v1/auth/register/send-otp', method: 'POST', payload: { phone: `+90${TEST_PHONE}`, country: 'TR' } },
      { url: 'https://www.lrworld.com/tr/api/auth/register/send-otp', method: 'POST', payload: { phone: `+90${TEST_PHONE}`, country: 'TR' } },
      { url: 'https://www.lrworld.com/tr/api/v1/auth/register/send-otp', method: 'POST', payload: { phone: `+90${TEST_PHONE}`, country: 'TR' } },
    ],
  },
  {
    name: 'Onur Market',
    urls: [
      { url: 'https://kurumsal.onurmarket.com/api/v1/auth/register/sendOtp', method: 'POST', payload: { phone: TEST_PHONE } },
      { url: 'https://www.onurmarket.com/api/member/register/sendOtp', method: 'POST', payload: { phone: TEST_PHONE } },
    ],
  },
  {
    name: 'LC Waikiki',
    urls: [
      { url: 'https://www.lcwaikiki.com.tr/api/member/register/sendOtp', method: 'POST', payload: { Phone: `90${TEST_PHONE}`, Password: 'Test123!', Email: TEST_EMAIL } },
    ],
  },
  {
    name: 'Shop&Fly',
    urls: [
      { url: 'https://seyahat.shopandfly.com.tr/api/auth/register/sendOtp', method: 'POST', payload: { phone: `90${TEST_PHONE}` } },
    ],
  },
  {
    name: 'Happy Center',
    urls: [
      { url: 'https://www.happycenter.com.tr/api/member/register/sendOtp', method: 'POST', payload: { Phone: `05${TEST_PHONE}`, Email: TEST_EMAIL } },
    ],
  },
];

async function testAlternatives() {
  console.log('=== Testing Alternative URLs ===\n');

  for (const alt of alternatives) {
    console.log(`\n--- ${alt.name} ---`);
    for (const ep of alt.urls) {
      process.stdout.write(`  ${ep.url} `);
      const headers = buildRotatingHeaders(new URL(ep.url).origin);
      if (ep.headers) Object.assign(headers, ep.headers);

      const result = await executeRequest(ep.url, ep.method, ep.payload, headers, 15000);

      if (result.success) {
        console.log(`✅ ${result.status}`);
        const dataStr = typeof result.data === 'string' ? result.data.substring(0, 100) : JSON.stringify(result.data).substring(0, 100);
        console.log(`    Response: ${dataStr}`);
      } else {
        const reason = result.status === 0 ? 'NETWORK_ERROR' :
                       result.status >= 400 ? `HTTP ${result.status}` :
                       'HTML_PAGE';
        console.log(`❌ ${reason}`);
      }

      await new Promise(r => setTimeout(r, 1000));
    }
  }
}

testAlternatives().catch(console.error);
