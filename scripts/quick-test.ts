import { TARGET_ENDPOINTS } from '../constants';
import { attemptStrategies, interpolatePhone } from '../services/proxy-core';
import * as fs from 'fs';
import * as path from 'path';

const TEST_PHONE = '5551234567';
const TEST_EMAIL = 'test.user@example.com';

async function quickTest() {
  console.log('=== Quick Strategy Chain Test ===\n');
  const limited = TARGET_ENDPOINTS.filter(e => e.status === 'limited');
  const results: any[] = [];

  for (let i = 0; i < limited.length; i++) {
    const ep = limited[i];
    process.stdout.write(`[${i + 1}/${limited.length}] ${ep.name.padEnd(20)} `);

    let payload: any;
    try {
      const parsed = JSON.parse(ep.payloadInfo);
      payload = interpolatePhone(parsed, TEST_PHONE, TEST_EMAIL);
    } catch {
      payload = { phone: TEST_PHONE };
    }

    const stratResults = await attemptStrategies({
      serviceUrl: ep.url,
      serviceMethod: ep.method || 'POST',
      targetPhone: TEST_PHONE,
      email: TEST_EMAIL,
      payloadToUse: payload,
      customHeaders: ep.headers as Record<string, string> | undefined,
    });

    const success = stratResults.some(r => r.success);
    const winner = stratResults.find(r => r.success);

    if (success) {
      console.log(`✅ ${winner!.strategy} (#${winner!.attempt})`);
      results.push({ name: ep.name, status: 'working', winningStrategy: winner!.strategy, url: ep.url });
    } else {
      const lastReason = stratResults[stratResults.length - 1];
      const reason = lastReason?.status ? `HTTP ${lastReason.status}` : 'all_failed';
      console.log(`❌ ${reason}`);
      results.push({ name: ep.name, status: 'failed', reason, url: ep.url });
    }

    await new Promise(r => setTimeout(r, 1000));
  }

  console.log('\n=== Summary ===');
  const working = results.filter(r => r.status === 'working').length;
  const failed = results.filter(r => r.status === 'failed').length;
  console.log(`Working: ${working}, Failed: ${failed}`);

  for (const r of results) {
    const icon = r.status === 'working' ? '✅' : '❌';
    console.log(` ${icon} ${r.name.padEnd(20)} | ${r.status === 'working' ? r.winningStrategy : r.reason}`);
  }

  const outPath = path.join(process.cwd(), 'quick-test-results.json');
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2), 'utf-8');
  console.log(`\nFull: ${outPath}`);
}

quickTest().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
