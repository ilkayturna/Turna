import { SpeedLevel, SPEED_CONFIG, RequestStatus, LogEntry } from '../types';

interface QueueTask {
  id: string;
  execute: () => Promise<LogEntry>;
}

export class AdaptiveConcurrencyQueue {
  private config: { maxConcurrent: number; batchDelay: number; minEndpointGap: number };
  private currentPool: number;
  private lastRequestTime: Map<string, number> = new Map();
  private consecutiveRateLimits = 0;
  private onStatsChange?: (pool: number, rateLimited: number) => void;

  constructor(level: SpeedLevel, onStatsChange?: (pool: number, rateLimited: number) => void) {
    this.config = SPEED_CONFIG[level];
    this.currentPool = this.config.maxConcurrent;
    this.onStatsChange = onStatsChange;
  }

  setLevel(level: SpeedLevel): void {
    this.config = SPEED_CONFIG[level];
  }

  async run(tasks: QueueTask[], signal?: AbortSignal): Promise<LogEntry[]> {
    const shuffled = [...tasks].sort(() => Math.random() - 0.5);
    const results: LogEntry[] = [];
    let index = 0;

    const executeNext = async (): Promise<void> => {
      while (index < shuffled.length) {
        if (signal?.aborted) return;

        const task = shuffled[index++];
        const now = Date.now();
        const lastTime = this.lastRequestTime.get(task.id) || 0;
        const waitTime = this.config.minEndpointGap - (now - lastTime);

        if (waitTime > 0) {
          await this.sleep(waitTime + Math.random() * 200);
        }

        this.lastRequestTime.set(task.id, Date.now());

        if (index > 1) {
          await this.sleep(Math.random() * this.config.batchDelay);
        }

        const result = await task.execute();
        results.push(result);

        if (result.status === RequestStatus.RATE_LIMITED || result.status === RequestStatus.FAILED) {
          this.consecutiveRateLimits++;
          if (this.consecutiveRateLimits >= 2) {
            this.currentPool = Math.max(2, this.currentPool - 1);
            this.onStatsChange?.(this.currentPool, this.consecutiveRateLimits);
            await this.sleep(1000 + Math.random() * 2000);
          }
        } else {
          this.consecutiveRateLimits = 0;
          if (this.currentPool < this.config.maxConcurrent) {
            this.currentPool++;
            this.onStatsChange?.(this.currentPool, 0);
          }
        }
      }
    };

    const safePool = Math.min(this.currentPool, shuffled.length);
    const workers = Array.from({ length: safePool }, () => executeNext());
    await Promise.all(workers);

    return results;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms));
  }
}
