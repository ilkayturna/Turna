import { describe, it, expect } from 'vitest';
import {
  pickRandom,
  buildRotatingHeaders,
  interpolatePhone,
  cleanHtmlForAi,
  findPhoneField,
  buildSmartVariants,
  PHONE_FIELD_NAMES,
  USER_AGENTS,
} from '../../services/proxy-core';

describe('pickRandom', () => {
  it('should return an element from the array', () => {
    const arr = [1, 2, 3];
    const result = pickRandom(arr);
    expect(arr).toContain(result);
  });

  it('should return undefined for empty array', () => {
    expect(pickRandom([])).toBeUndefined();
  });
});

describe('buildRotatingHeaders', () => {
  it('should return headers object', () => {
    const headers = buildRotatingHeaders();
    expect(headers).toBeDefined();
    expect(headers['User-Agent']).toBeDefined();
    expect(headers['Accept']).toBe('application/json, text/plain, */*');
    expect(headers['Content-Type']).toBe('application/json');
  });

  it('should include valid User-Agent', () => {
    const headers = buildRotatingHeaders();
    expect(USER_AGENTS).toContain(headers['User-Agent']);
  });

  it('should add Origin and Referer when origin is provided', () => {
    const headers = buildRotatingHeaders('https://example.com');
    expect(headers['Origin']).toBe('https://example.com');
    expect(headers['Referer']).toBe('https://example.com/');
  });

  it('should not add Origin when not provided', () => {
    const headers = buildRotatingHeaders();
    expect(headers['Origin']).toBeUndefined();
  });
});

describe('interpolatePhone', () => {
  const targetPhone = '5321234567';

  it('should replace 5XXXXXXXXX with target phone', () => {
    const result = interpolatePhone({ phone: '5XXXXXXXXX' }, targetPhone);
    expect(result.phone).toBe(targetPhone);
  });

  it('should replace 905XXXXXXXXX with 90 prefix', () => {
    const result = interpolatePhone({ phone: '905XXXXXXXXX' }, targetPhone);
    expect(result.phone).toBe(`90${targetPhone}`);
  });

  it('should replace 05XXXXXXXXX with 0 prefix', () => {
    const result = interpolatePhone({ phone: '05XXXXXXXXX' }, targetPhone);
    expect(result.phone).toBe(`0${targetPhone}`);
  });

  it('should replace +905XXXXXXXXX with +90 prefix', () => {
    const result = interpolatePhone({ phone: '+905XXXXXXXXX' }, targetPhone);
    expect(result.phone).toBe(`+90${targetPhone}`);
  });

  it('should replace {{PHONE}} with target phone', () => {
    const result = interpolatePhone({ phone: '{{PHONE}}' }, targetPhone);
    expect(result.phone).toBe(targetPhone);
  });

  it('should replace {{EMAIL}} with provided email', () => {
    const result = interpolatePhone({ email: '{{EMAIL}}' }, targetPhone, 'user@test.com');
    expect(result.email).toBe('user@test.com');
  });

  it('should default email to test@test.com', () => {
    const result = interpolatePhone({ email: '{{EMAIL}}' }, targetPhone);
    expect(result.email).toBe('test@test.com');
  });

  it('should handle deep nested objects', () => {
    const result = interpolatePhone({ user: { phone: '5XXXXXXXXX', email: '{{EMAIL}}' } }, targetPhone, 'a@b.com');
    expect(result.user.phone).toBe(targetPhone);
    expect(result.user.email).toBe('a@b.com');
  });
});

describe('cleanHtmlForAi', () => {
  it('should return placeholder for empty input', () => {
    expect(cleanHtmlForAi('')).toBe('No body');
    expect(cleanHtmlForAi(null as unknown as string)).toBe('No body');
    expect(cleanHtmlForAi(undefined as unknown as string)).toBe('No body');
  });

  it('should remove script tags', () => {
    const result = cleanHtmlForAi('Hello <script>alert("xss")</script> World');
    expect(result).not.toContain('<script>');
  });

  it('should remove style tags', () => {
    const result = cleanHtmlForAi('Text <style>.cls { color: red; }</style> more');
    expect(result).not.toContain('<style>');
  });

  it('should remove HTML comments', () => {
    const result = cleanHtmlForAi('A<!-- comment -->B');
    expect(result).not.toContain('<!--');
  });

  it('should truncate long strings at 2500 chars', () => {
    const long = 'x'.repeat(3000);
    const result = cleanHtmlForAi(long);
    expect(result.length).toBeLessThanOrEqual(2515);
    expect(result).toContain('[TRUNCATED]');
  });
});

describe('findPhoneField', () => {
  it('should find phone field by pattern 5XXXXXXXXX', () => {
    expect(findPhoneField({ phone: '5XXXXXXXXX' })).toBe('phone');
  });

  it('should find phone field by actual number', () => {
    expect(findPhoneField({ gsm: '5321234567' })).toBe('gsm');
  });

  it('should find phone field with prefix', () => {
    expect(findPhoneField({ mobile: '905321234567' })).toBe('mobile');
  });

  it('should return null when no phone field found', () => {
    expect(findPhoneField({ name: 'Test' })).toBeNull();
  });

  it('should return null for empty object', () => {
    expect(findPhoneField({})).toBeNull();
  });
});

describe('buildSmartVariants', () => {
  it('should generate variants with different phone field names', () => {
    const variants = buildSmartVariants({ phone: '5XXXXXXXXX' }, '5321234567');
    expect(variants.length).toBeGreaterThan(0);
    const fieldNames = variants.map(v => Object.keys(v).find(k => k !== 'email')).filter(Boolean) as string[];
    expect(fieldNames).toContain('phone');
    expect(fieldNames).toContain('gsm');
    expect(fieldNames).toContain('mobilePhone');
  });

  it('should include email when provided', () => {
    const variants = buildSmartVariants({ phone: '5XXXXXXXXX', email: '{{EMAIL}}' }, '5321234567', 'test@test.com');
    const hasEmail = variants.some(v => 'email' in v);
    expect(hasEmail).toBe(true);
  });
});

describe('PHONE_FIELD_NAMES', () => {
  it('should contain common phone field names', () => {
    expect(PHONE_FIELD_NAMES).toContain('phone');
    expect(PHONE_FIELD_NAMES).toContain('gsm');
    expect(PHONE_FIELD_NAMES).toContain('cellPhone');
    expect(PHONE_FIELD_NAMES).toContain('telephone');
  });
});

describe('USER_AGENTS', () => {
  it('should contain multiple user agents', () => {
    expect(USER_AGENTS.length).toBeGreaterThanOrEqual(8);
    expect(USER_AGENTS.every(ua => ua.startsWith('Mozilla/'))).toBe(true);
  });
});
