import { ServiceDefinition, RequestStatus, LogEntry } from '../types';
import { AUTHORIZED_PHONE_NUMBERS, REQUEST_TIMEOUT_MS } from '../constants';

/**
 * Tek geçişli OTP smoke test motoru.
 *
 * Tasarım gereği yapamadıkları:
 *  - Proxy yok, header rotasyonu yok, sahte cihaz kimliği yok (doğrudan fetch).
 *  - `mode: 'no-cors'` yok: yanıt okunamıyorsa istek "başarılı sayılmaz".
 *  - Tekrar deneme (retry), döngü, paralellik yok. Çağrı başına tek istek.
 *  - Numarayı uydurmaz: yalnızca yetkili listedeki numaraya istek atar.
 *  - E-posta uydurmaz: şablon e-posta istiyorsa kullanıcı kendi adresini verir.
 */

export class UnauthorizedTargetError extends Error {
  constructor(phone: string) {
    super(
      `Numara yetkili listede değil (${phone || 'boş'}). Yalnızca kendinize ait, ` +
        `VITE_AUTHORIZED_PHONE_NUMBERS içinde tanımlı numaralar test edilebilir.`,
    );
    this.name = 'UnauthorizedTargetError';
  }
}

export function assertAuthorizedNumber(phone: string, allowList: string[] = AUTHORIZED_PHONE_NUMBERS): void {
  if (!allowList.includes(phone)) throw new UnauthorizedTargetError(phone);
}

export type PayloadResult = { ok: true; payload: Record<string, unknown> } | { ok: false; reason: string };

export function buildPayload(endpoint: ServiceDefinition, phone: string, email?: string): PayloadResult {
  const national = phone.replace(/\D/g, '');
  const international = `90${national}`;
  const template = endpoint.payloadInfo ?? '{"phone": "5XXXXXXXXX"}';
  const trimmedEmail = (email ?? '').trim();

  if (template.includes('{{EMAIL}}') && !trimmedEmail) {
    return {
      ok: false,
      reason: 'Bu uç nokta e-posta alanı istiyor: kendi adresinizi girin (araç sahte adres üretmez).',
    };
  }

  const rendered = template
    .replace(/905XXXXXXXXX/g, international)
    .replace(/5XXXXXXXXX/g, national)
    .replace(/\{\{EMAIL\}\}/g, trimmedEmail);

  try {
    return { ok: true, payload: JSON.parse(rendered) as Record<string, unknown> };
  } catch {
    return { ok: false, reason: 'payloadInfo geçerli JSON değil.' };
  }
}

const RATE_LIMIT_PATTERNS = [/çok fazla istek/i, /cok fazla istek/i, /too many requests/i, /rate.?limit/i, /tekrar deneyiniz/i];

function looksRateLimited(status: number, body: string): boolean {
  if (status === 429) return true;
  return RATE_LIMIT_PATTERNS.some(re => re.test(body));
}

function entry(serviceName: string, status: RequestStatus, message: string, startTime: number): LogEntry {
  return {
    id: Math.random().toString(36).slice(2, 11),
    timestamp: new Date().toLocaleTimeString(),
    serviceName,
    status,
    message,
    latency: Math.round(performance.now() - startTime),
  };
}

export interface SmokeTestOptions {
  phone: string;
  email?: string;
  signal?: AbortSignal;
  /** Test için allow-list enjeksiyonu (varsayılan: constants içindeki yetkili liste). */
  allowList?: string[];
}

export async function runSmokeTest(endpoint: ServiceDefinition, options: SmokeTestOptions): Promise<LogEntry> {
  const { phone, email, signal, allowList } = options;
  const startTime = performance.now();

  try {
    assertAuthorizedNumber(phone, allowList);
  } catch (error) {
    return entry(endpoint.name, RequestStatus.FAILED, (error as Error).message, startTime);
  }

  const built = buildPayload(endpoint, phone, email);
  if (built.ok === false) {
    return entry(endpoint.name, RequestStatus.FAILED, built.reason, startTime);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const forwardAbort = () => controller.abort();
  signal?.addEventListener('abort', forwardAbort);

  try {
    const response = await fetch(endpoint.url, {
      method: endpoint.method ?? 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(endpoint.headers ?? {}),
      },
      body: endpoint.method === 'GET' ? undefined : JSON.stringify(built.payload),
      credentials: 'omit',
      signal: controller.signal,
    });

    const body = (await response.text().catch(() => '')).slice(0, 300);

    if (response.ok) {
      return entry(endpoint.name, RequestStatus.SUCCESS, `${response.status} OK | ${body || 'boş yanıt'}`, startTime);
    }
    if (looksRateLimited(response.status, body)) {
      return entry(endpoint.name, RequestStatus.RATE_LIMITED, `${response.status} | ${body || 'hız sınırı'}`, startTime);
    }
    return entry(endpoint.name, RequestStatus.FAILED, `${response.status} | ${body || 'hata'}`, startTime);
  } catch (error) {
    const aborted = signal?.aborted || (error as Error)?.name === 'AbortError';
    const message = aborted
      ? 'İptal edildi / zaman aşımı'
      : `İstek gönderilemedi (ağ veya CORS): ${(error as Error)?.message ?? 'bilinmeyen hata'}`;
    return entry(endpoint.name, RequestStatus.FAILED, message, startTime);
  } finally {
    clearTimeout(timeoutId);
    signal?.removeEventListener('abort', forwardAbort);
  }
}
