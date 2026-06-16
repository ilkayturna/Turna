import { RequestStatus, LogEntry } from '../types';

interface QueueTask {
  id: string;
  execute: () => Promise<LogEntry>;
}

export class AdaptiveConcurrencyQueue {
  private maxConcurrent = 50;
  private staggerDelay = 0;
  private minEndpointGap = 0;
  private lastRequestTime: Map<string, number> = new Map();
  private consecutiveRateLimits = 0;

  async run(tasks: QueueTask[], signal?: AbortSignal, onResult?: (result: LogEntry) => void): Promise<LogEntry[]> {
    const results: LogEntry[] = [];
    let index = 0;

    const executeNext = async (): Promise<void> => {
      while (index < tasks.length || results.length < tasks.length * 3) {
        if (signal?.aborted) return;

        // CYCLE: restart from beginning for continuous flood
        if (index >= tasks.length) {
          index = 0;
          await this.sleep(50); // tiny gap between cycles
        }

        const task = tasks[index++];

        const result = await task.execute();
        results.push(result);
        onResult?.(result);

        if (result.status === RequestStatus.RATE_LIMITED || result.status === RequestStatus.FAILED) {
          this.consecutiveRateLimits++;
          if (this.consecutiveRateLimits >= 10) {
            this.maxConcurrent = Math.max(15, this.maxConcurrent - 2);
            await this.sleep(200);
          }
        } else {
          this.consecutiveRateLimits = 0;
          if (this.maxConcurrent < 50) this.maxConcurrent++;
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
