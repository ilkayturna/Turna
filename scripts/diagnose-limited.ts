import { TARGET_ENDPOINTS } from '../constants';
import { buildRotatingHeaders, executeRequest, interpolatePhone } from '../services/proxy-core';
import * as fs from 'fs';
import * as path from 'path';

const TEST_PHONE = '5551234567';
const TEST_EMAIL = 'test.user@example.com';

interface DiagnosisResult {
  name: string;
  id: string;
  url: string;
  status: number;
  success: boolean;
  data: any;
  errorCategory: string;
  note: string;
}

function categorizeError(status: number, data: any): string {
  if (status === 0) return 'NETWORK_ERROR';
  if (status === 404) return 'EXPIRED_URL';
  if (status === 429) return 'RATE_LIMIT';
  if (status === 403) return 'FORBIDDEN';
  if (status === 401) return 'UNAUTHORIZED';
  if (status === 400) return 'BAD_REQUEST';
  if (status === 405) return 'METHOD_WRONG';
  if (status >= 500) return 'SERVER_ERROR';
  if (data && typeof data === 'string' && data.toLowerCase().includes('cloudflare')) return 'CLOUDFLARE';
  if (data && typeof data === 'string' && data.includes('<html') && data.length > 200) return 'HTML_PAGE';
  return 'UNKNOWN';
}

function extractNote(data: any, status: number): string {
  if (!data) return 'empty';
  const str = typeof data === 'string' ? data : JSON.stringify(data);
  const cleaned = str.replace(/\s+/g, ' ').substring(0, 200);
  return cleaned;
}

async function diagnose() {
  console.log('=== DIAGNOSIS: Limited Endpoints ===\n');

  const limitedEndpoints = TARGET_ENDPOINTS.filter(e => e.status === 'limited');
  const allResults: DiagnosisResult[] = [];
  const logLines: string[] = [];

  for (let i = 0; i < limitedEndpoints.length; i++) {
    const ep = limitedEndpoints[i];
    process.stdout.write(`[${i + 1}/${limitedEndpoints.length}] ${ep.name}... `);

    let payload: any;
    try {
      const parsed = JSON.parse(ep.payloadInfo);
      payload = interpolatePhone(parsed, TEST_PHONE, TEST_EMAIL);
    } catch {
      payload = { phone: TEST_PHONE };
    }

    const origin = new URL(ep.url).origin;
    const headers = buildRotatingHeaders(origin);
    if (ep.headers) {
      Object.assign(headers, ep.headers as Record<string, string>);
    }

    const result = await executeRequest(ep.url, ep.method || 'POST', payload, headers, 20000);

    if (result.success) {
      console.log(`✅ ${result.status}`);
    } else {
      console.log(`❌ ${result.status}`);
    }

    const category = categorizeError(result.status, result.data);
    const note = extractNote(result.data, result.status);

    allResults.push({
      name: ep.name,
      id: ep.id,
      url: ep.url,
      status: result.status,
      success: result.success,
      data: result.data,
      errorCategory: category,
      note,
    });

    logLines.push(`${ep.id}|${result.status}|${category}|${note}`);

    await new Promise(r => setTimeout(r, 800));
  }

  console.log('\n\n=== DIAGNOSIS RESULTS ===');
  console.log('='.repeat(100));
  console.log(`${'NAME'.padEnd(22)} ${'STATUS'.padEnd(8)} ${'CATEGORY'.padEnd(18)} RESPONSE`);
  console.log('-'.repeat(100));

  for (const r of allResults) {
    console.log(`${r.name.padEnd(22)} ${String(r.status).padEnd(8)} ${r.errorCategory.padEnd(18)} ${r.note.substring(0, 50)}`);
  }

  console.log('\n=== CATEGORY BREAKDOWN ===');
  const catCounts: Record<string, number> = {};
  for (const r of allResults) {
    catCounts[r.errorCategory] = (catCounts[r.errorCategory] || 0) + 1;
  }
  for (const [cat, count] of Object.entries(catCounts)) {
    console.log(`  ${cat}: ${count}`);
  }

  const working = allResults.filter(r => r.success).length;
  console.log(`\nTotal: ${allResults.length} limited endpoints`);
  console.log(`Working: ${working}`);
  console.log(`Failed: ${allResults.length - working}`);

  const resultsPath = path.join(process.cwd(), 'diagnosis-results.json');
  fs.writeFileSync(resultsPath, JSON.stringify(allResults, null, 2), 'utf-8');
  console.log(`\nFull results: ${resultsPath}`);

  const logPath = path.join(process.cwd(), 'diagnosis-summary.txt');
  const summaryLines = allResults.map(r => `${r.name}\t${r.status}\t${r.errorCategory}\t${r.note.substring(0, 120)}`);
  fs.writeFileSync(logPath, summaryLines.join('\n'), 'utf-8');
}

diagnose().catch(err => {
  console.error('\nFatal error:', err);
  process.exit(1);
});
