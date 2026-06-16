import { RequestStatus, LogEntry } from '../types';

interface QueueTask {
  id: string;
  endpointId: string;
  execute: () => Promise<LogEntry>;
}

interface EndpointCooldown {
  until: number;
  duration: number;
  banCount: number;
}

// Parse Turkish rate-limit messages to extract wait time
function parseRateLimit(response: string): number | null {
  // "Lütfen 2 dakika 23 saniye sonra tekrar deneyiniz"
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
  private consecutiveRateLimits = 0;

  async run(tasks: QueueTask[], signal?: AbortSignal, onResult?: (result: LogEntry) => void): Promise<LogEntry[]> {
    const results: LogEntry[] = [];
    let index = 0;

    const executeNext = async (): Promise<void> => {
      while (!signal?.aborted) {
        // CYCLE: restart from beginning for continuous flood
        if (index >= tasks.length) {
          index = 0;
          await this.sleep(100); // tiny gap between cycles
        }

        const task = tasks[index++];

        // Check cooldown — skip if rate-limited
        const cooldown = this.cooldowns.get(task.endpointId);
        if (cooldown && Date.now() < cooldown.until) {
          continue; // skip, don't even try
        }

        const result = await task.execute();
        results.push(result);
        onResult?.(result);

        if (result.status === RequestStatus.RATE_LIMITED) {
          // Parse actual wait time from response
          const waitTime = parseRateLimit(result.message) || 30000;
          const banCount = (this.cooldowns.get(task.endpointId)?.banCount || 0) + 1;
          // Add 5s buffer to avoid hitting the limit exactly
          this.cooldowns.set(task.endpointId, {
            until: Date.now() + waitTime + 5000,
            duration: waitTime,
            banCount,
          });
        } else if (result.status === RequestStatus.FAILED) {
          // Check if it's a rate-limit in disguise (Koton/Evidea style)
          const msg = result.message.toLowerCase();
          if (msg.includes('cok fazla istek') || msg.includes('lütfen') || msg.includes('tekrar deneyiniz')) {
            const waitTime = parseRateLimit(result.message) || 120000;
            this.cooldowns.set(task.endpointId, {
              until: Date.now() + waitTime + 5000,
              duration: waitTime,
              banCount: 1,
            });
          }
        } else {
          // Success — clear cooldown
          this.cooldowns.delete(task.endpointId);
        }
      }
    };

    // TURBO MODE: Fire everything at once
    const safePool = Math.min(this.maxConcurrent, tasks.length);
    const workers = Array.from({ length: safePool }, () => executeNext());
    await Promise.all(workers);

    return results;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms));
  }
}
