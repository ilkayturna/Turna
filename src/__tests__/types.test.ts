import { describe, it, expect } from 'vitest';
import { RequestStatus } from '../../types';

describe('RequestStatus enum', () => {
  it('should have correct values', () => {
    expect(RequestStatus.PENDING).toBe('PENDING');
    expect(RequestStatus.SUCCESS).toBe('SUCCESS');
    expect(RequestStatus.FAILED).toBe('FAILED');
    expect(RequestStatus.RATE_LIMITED).toBe('RATE_LIMITED');
    expect(RequestStatus.SENT).toBe('SENT');
  });

  it('should have exactly 5 statuses', () => {
    expect(Object.keys(RequestStatus).length).toBe(5);
  });
});
