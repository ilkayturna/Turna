import { RequestStatus, LogEntry } from '../types';

interface QueueTask {
  id: string;
  execute: () => Promise<LogEntry>;
}

export class AdaptiveConcurrencyQueue {
  private maxConcurrent = 5;
  private staggerDelay = 300;
  private minEndpointGap = 2000;
  private lastRequestTime: Map<string, number> = new Map();
  private consecutiveRateLimits = 0;

  async run(
    tasks: QueueTask[],
    signal?: AbortSignal,
    onResult?: (result: LogEntry) => void
  ): Promise<LogEntry[]> {
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
          await this.sleep(waitTime + Math.random() * 200);
        }

        this.lastRequestTime.set(task.id, Date.now());

        if (index > 1) {
          await this.sleep(Math.random() * this.staggerDelay);
        }

        const result = await task.execute();
        results.push(result);
        onResult?.(result);

        if (result.status === RequestStatus.RATE_LIMITED || result.status === RequestStatus.FAILED) {
          this.consecutiveRateLimits++;
          if (this.consecutiveRateLimits >= 2) {
            await this.sleep(1000 + Math.random() * 2000);
          }
        } else {
          this.consecutiveRateLimits = 0;
        }
      }
    };

    const safePool = Math.min(this.maxConcurrent, shuffled.length);
    const workers = Array.from({ length: safePool }, () => executeNext());
    await Promise.all(workers);

    return results;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms));
  }
}
