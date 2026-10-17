import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdaptiveConcurrencyQueue } from '../../services/queue';
import { RequestStatus, LogEntry } from '../../types';

function makeEntry(overrides: Partial<LogEntry> = {}): LogEntry {
  return {
    id: 'test',
    timestamp: '12:00:00',
    serviceName: 'test',
    status: RequestStatus.SUCCESS,
    message: 'OK',
    latency: 100,
    ...overrides,
  };
}

describe('AdaptiveConcurrencyQueue', () => {
  let queue: AdaptiveConcurrencyQueue;

  beforeEach(() => {
    queue = new AdaptiveConcurrencyQueue();
  });

  it('should run all tasks and return results regardless of order', async () => {
    const tasks = [
      { id: 'a', execute: () => Promise.resolve(makeEntry({ serviceName: 'A' })) },
      { id: 'b', execute: () => Promise.resolve(makeEntry({ serviceName: 'B' })) },
    ];
    const results = await queue.run(tasks);
    expect(results).toHaveLength(2);
    expect(new Set(results.map(r => r.serviceName))).toEqual(new Set(['A', 'B']));
  });

  it('should abort when signal is aborted', async () => {
    const controller = new AbortController();
    const tasks = [
      {
        id: 'slow',
        execute: async () => {
          await new Promise(r => setTimeout(r, 1000));
          return makeEntry();
        },
      },
      {
        id: 'slow2',
        execute: async () => {
          await new Promise(r => setTimeout(r, 1000));
          return makeEntry();
        },
      },
    ];

    controller.abort();
    const results = await queue.run(tasks, controller.signal);
    expect(results.length).toBe(0);
  });

  it('should call onResult callback for each task', async () => {
    const onResult = vi.fn();
    const tasks = [
      { id: 'a', execute: () => Promise.resolve(makeEntry({ serviceName: 'A' })) },
      { id: 'b', execute: () => Promise.resolve(makeEntry({ serviceName: 'B' })) },
    ];
    await queue.run(tasks, undefined, onResult);
    expect(onResult).toHaveBeenCalledTimes(2);
  });

  it('should handle empty tasks array', async () => {
    const results = await queue.run([]);
    expect(results).toHaveLength(0);
  });

  it('should handle task failures gracefully', async () => {
    const tasks = [
      { id: 'a', execute: () => Promise.resolve(makeEntry({ status: RequestStatus.FAILED })) },
      { id: 'b', execute: () => Promise.resolve(makeEntry({ status: RequestStatus.SUCCESS })) },
    ];
    const results = await queue.run(tasks);
    expect(results).toHaveLength(2);
    expect(results[0].status).toBe(RequestStatus.FAILED);
    expect(results[1].status).toBe(RequestStatus.SUCCESS);
  });
});
