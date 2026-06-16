import { RequestStatus, LogEntry } from '../types';

interface QueueTask {
  id: string;
  execute: () => Promise<LogEntry>;
}

export class AdaptiveConcurrencyQueue {
  private maxConcurrent = 30;
  private staggerDelay = 0;
  private minEndpointGap = 0;
  private lastRequestTime: Map<string, number> = new Map();
  private consecutiveRateLimits = 0;

  async run(tasks: QueueTask[], signal?: AbortSignal, onResult?: (result: LogEntry) => void): Promise<LogEntry[]> {
    const shuffled = [...tasks].sort(() => Math.random() - 0.5);
    const results: LogEntry[] = [];
    let index = 0;

    const executeNext = async (): Promise<void> => {
      while (index < shuffled.length) {
        if (signal?.aborted) return;

        const task = shuffled[index++];
        const now = Date.now();
        const lastTime = this.lastRequestTime.get(task.id) || 0;
        const waitTime = this.minEndpointGap - (now - lastTime);

        if (waitTime > 0) {
          await this.sleep(waitTime);
        }

        this.lastRequestTime.set(task.id, Date.now());

        const result = await task.execute();
        results.push(result);
        onResult?.(result);

        if (result.status === RequestStatus.RATE_LIMITED || result.status === RequestStatus.FAILED) {
          this.consecutiveRateLimits++;
          if (this.consecutiveRateLimits >= 5) {
            this.maxConcurrent = Math.max(10, this.maxConcurrent - 2);
            await this.sleep(300);
          }
        } else {
          this.consecutiveRateLimits = 0;
          if (this.maxConcurrent < 30) this.maxConcurrent++;
        }
      }
    };

    // TURBO MODE: All endpoints fire at once
    const safePool = Math.min(this.maxConcurrent, shuffled.length);
    const workers = Array.from({ length: safePool }, () => executeNext());
    await Promise.all(workers);

    return results;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms));
  }
}
