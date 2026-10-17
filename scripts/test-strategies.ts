import { TARGET_ENDPOINTS } from '../constants';
import { buildRotatingHeaders, executeRequest, interpolatePhone, isHtmlBody, attemptStrategies } from '../services/proxy-core';
import * as fs from 'fs';
import * as path from 'path';

const TEST_PHONE = '5551234567';
const TEST_EMAIL = 'test.user@example.com';

interface StrategyResult {
  endpoint: string;
  id: string;
  url: string;
  strategies: { attempt: number; strategy: string; success: boolean; status: number; note: string }[];
  finalSuccess: boolean;
  winningStrategy: string;
}

async function testStrategies() {
  console.log('=== FULL STRATEGY CHAIN DIAGNOSIS ===\n');

  // Only test limited endpoints
  const limited = TARGET_ENDPOINTS.filter(e => e.status === 'limited');
  console.log(`Testing ${limited.length} limited endpoints through all 9 strategies...\n`);

  const allResults: StrategyResult[] = [];

  for (let i = 0; i < limited.length; i++) {
    const ep = limited[i];
    process.stdout.write(`[${i + 1}/${limited.length}] ${ep.name}... `);

    let payload: any;
    try {
      const parsed = JSON.parse(ep.payloadInfo);
      payload = interpolatePhone(parsed, TEST_PHONE, TEST_EMAIL);
    } catch {
      payload = { phone: TEST_PHONE };
    }

    const result = await attemptStrategies({
      serviceUrl: ep.url,
      serviceMethod: ep.method || 'POST',
      targetPhone: TEST_PHONE,
      email: TEST_EMAIL,
      payloadToUse: payload,
      customHeaders: ep.headers as Record<string, string> | undefined,
    });

    const success = result.some(r => r.success);
    const winner = result.find(r => r.success);
    const stratSummary = result.map(r => `${r.attempt}:${r.strategy}=${r.success ? '✅' : '❌'}(${r.status})`).join(' ');

    console.log(success ? `✅ ${winner?.strategy}` : '❌ ALL FAILED');

    allResults.push({
      endpoint: ep.name,
      id: ep.id,
      url: ep.url,
      strategies: result.map(r => ({
        attempt: r.attempt,
        strategy: r.strategy,
        success: r.success,
        status: r.status,
        note: typeof r.data === 'string' ? r.data.substring(0, 80) : JSON.stringify(r.data).substring(0, 80),
      })),
      finalSuccess: success,
      winningStrategy: winner?.strategy || 'none',
    });

    await new Promise(r => setTimeout(r, 200));
  }

  console.log('\n\n=== RESULTS ===');
  console.log('='.repeat(120));
  for (const r of allResults) {
    const icon = r.finalSuccess ? '✅' : '❌';
    console.log(`${icon} ${r.endpoint.padEnd(20)} | ${r.winningStrategy.padEnd(25)} | Stratégies: ${r.strategies.map(s => s.status).join(',')}`);
  }

  const working = allResults.filter(r => r.finalSuccess).length;
  console.log(`\nLimited: ${limited.length} | Fixed by strategy chain: ${working} | Still broken: ${limited.length - working}`);

  const outputPath = path.join(process.cwd(), 'strategy-test-results.json');
  fs.writeFileSync(outputPath, JSON.stringify(allResults, null, 2), 'utf-8');
  console.log(`Full results: ${outputPath}`);
}

testStrategies().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
