import { describe, it, expect, vi, afterEach } from 'vitest';
import { assertAuthorizedNumber, buildPayload, runSmokeTest, UnauthorizedTargetError } from '../../services/smoke-test';
import { RequestStatus, ServiceDefinition } from '../../types';

const ALLOW_LIST = ['5343622375'];

const OWN_ENDPOINT: ServiceDefinition = {
  id: 'own-service',
  name: 'Kendi Servisim',
  url: 'https://api.sirketim.example/v1/auth/otp',
  method: 'POST',
  headers: { 'X-Client-Platform': 'web' },
  payloadInfo: '{"phoneNumber": "5XXXXXXXXX", "email": "{{EMAIL}}"}',
};

function response(status: number, body = ''): Response {
  return { ok: status >= 200 && status < 300, status, text: async () => body } as unknown as Response;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('assertAuthorizedNumber', () => {
  it('yetkili listedeki numaraya izin verir', () => {
    expect(() => assertAuthorizedNumber('5343622375', ALLOW_LIST)).not.toThrow();
  });

  it('listede olmayan numarayı reddeder', () => {
    expect(() => assertAuthorizedNumber('5551112233', ALLOW_LIST)).toThrow(UnauthorizedTargetError);
  });

  it('boş numarayı reddeder', () => {
    expect(() => assertAuthorizedNumber('', ALLOW_LIST)).toThrow(UnauthorizedTargetError);
  });
});

describe('buildPayload', () => {
  const plain: ServiceDefinition = { ...OWN_ENDPOINT, payloadInfo: '{"phoneNumber": "5XXXXXXXXX", "msisdn": "905XXXXXXXXX"}' };

  it('ulusal ve uluslararası placeholderları doldurur', () => {
    const result = buildPayload(plain, '5343622375', 'ben@sirketim.example');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.payload).toEqual({ phoneNumber: '5343622375', msisdn: '905343622375' });
    }
  });

  it('şablon e-posta istiyorsa ve e-posta verilmediyse gönderim yapmaz', () => {
    const result = buildPayload(OWN_ENDPOINT, '5343622375');
    expect(result.ok).toBe(false);
    if (result.ok === false) expect(result.reason).toContain('e-posta');
  });

  it('sahte e-posta üretmez', () => {
    const result = buildPayload(OWN_ENDPOINT, '5343622375', '  ');
    expect(result.ok).toBe(false);
  });

  it('geçersiz JSON şablonunu reddeder', () => {
    const result = buildPayload({ ...OWN_ENDPOINT, payloadInfo: '{bozuk' }, '5343622375', 'ben@sirketim.example');
    expect(result.ok).toBe(false);
  });
});

describe('runSmokeTest', () => {
  it('yetkisiz numarada hiç istek atmaz', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const result = await runSmokeTest(OWN_ENDPOINT, { phone: '5551112233', allowList: ALLOW_LIST });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.status).toBe(RequestStatus.FAILED);
    expect(result.message).toContain('yetkili listede değil');
  });

  it('çağrı başına tam olarak bir istek atar', async () => {
    const fetchMock = vi.fn().mockResolvedValue(response(200, 'ok'));
    vi.stubGlobal('fetch', fetchMock);

    const result = await runSmokeTest(OWN_ENDPOINT, {
      phone: '5343622375',
      email: 'ben@sirketim.example',
      allowList: ALLOW_LIST,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.status).toBe(RequestStatus.SUCCESS);
    expect(result.message).toContain('200');
  });

  it('proxy, no-cors veya header rotasyonu kullanmaz', async () => {
    const fetchMock = vi.fn().mockResolvedValue(response(200, 'ok'));
    vi.stubGlobal('fetch', fetchMock);

    await runSmokeTest(OWN_ENDPOINT, { phone: '5343622375', email: 'ben@sirketim.example', allowList: ALLOW_LIST });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(OWN_ENDPOINT.url);
    expect(init.mode).toBeUndefined();
    expect(init.credentials).toBe('omit');
    expect(init.headers).toEqual({ 'Content-Type': 'application/json', 'X-Client-Platform': 'web' });
  });

  it('429 yanıtını rate limited olarak sınıflar', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(429, 'çok fazla istek')));

    const result = await runSmokeTest(OWN_ENDPOINT, {
      phone: '5343622375',
      email: 'ben@sirketim.example',
      allowList: ALLOW_LIST,
    });

    expect(result.status).toBe(RequestStatus.RATE_LIMITED);
  });

  it('ağ hatasını başarı saymaz', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('CORS engeli')));

    const result = await runSmokeTest(OWN_ENDPOINT, {
      phone: '5343622375',
      email: 'ben@sirketim.example',
      allowList: ALLOW_LIST,
    });

    expect(result.status).toBe(RequestStatus.FAILED);
    expect(result.message).toContain('CORS');
  });

  it('e-posta gerektiren uç noktada istek atmadan uyarır', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const result = await runSmokeTest(OWN_ENDPOINT, { phone: '5343622375', allowList: ALLOW_LIST });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.status).toBe(RequestStatus.FAILED);
  });
});
