import { RequestStatus, LogEntry } from '../types';

interface QueueTask {
  id: string;
  endpointId: string;
  execute: () => Promise<LogEntry>;
}

interface EndpointCooldown {
  until: number;
  banCount: number;
}

function parseRateLimit(response: string): number | null {
  const minMatch = response.match(/(\d+)\s*dakika/);
  const secMatch = response.match(/(\d+)\s*saniye/);
  if (minMatch || secMatch) {
    const mins = minMatch ? parseInt(minMatch[1]) : 0;
    const secs = secMatch ? parseInt(secMatch[1]) : 0;
    return (mins * 60 + secs) * 1000;
  }
  return null;
}

export class AdaptiveConcurrencyQueue {
  private maxConcurrent = 50;
  private cooldowns: Map<string, EndpointCooldown> = new Map();

  async run(tasks: QueueTask[], signal?: AbortSignal, onResult?: (result: LogEntry) => void): Promise<LogEntry[]> {
    const results: LogEntry[] = [];
    let index = 0;

    const executeNext = async (): Promise<void> => {
      while (!signal?.aborted) {
        if (index >= tasks.length) {
          // ALL tasks done in this cycle — report and wait
          await this.sleep(50);
          return;
        }

        const task = tasks[index++];

        // Check cooldown
        const cooldown = this.cooldowns.get(task.endpointId);
        if (cooldown && Date.now() < cooldown.until) {
          continue; // skip, but index already advanced
        }

        const result = await task.execute();
        results.push(result);
        onResult?.(result);

        // Handle rate limiting
        const msg = result.message.toLowerCase();
        const isRateLimited =
          result.status === RequestStatus.RATE_LIMITED ||
          msg.includes('cok fazla istek') ||
          msg.includes('çok fazla istek') ||
          msg.includes('lütfen') && msg.includes('tekrar deneyiniz');

        if (isRateLimited) {
          const waitTime = parseRateLimit(result.message) || 120000;
          const banCount = (this.cooldowns.get(task.endpointId)?.banCount || 0) + 1;
          this.cooldowns.set(task.endpointId, {
            until: Date.now() + waitTime + 5000,
            banCount,
          });
        } else if (result.status === RequestStatus.SUCCESS) {
          this.cooldowns.delete(task.endpointId);
        }
      }
    };

    const safePool = Math.min(this.maxConcurrent, tasks.length);
    const workers = Array.from({ length: safePool }, () => executeNext());
    await Promise.all(workers);

    return results;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms));
  }
}
