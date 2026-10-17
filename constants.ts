import { ServiceDefinition } from './types';

/**
 * OTP SMOKE TEST — yetkili uç noktalar
 *
 * Bu araç, bir OTP/SMS uç noktasının "beklendiği gibi davranıp davranmadığını"
 * ölçen bir QA aracıdır: TEK GEÇİŞ, SIRALI, uç nokta başına TAM OLARAK BİR istek.
 * Döngü, paralel flood ve proxy rotasyonu yoktur.
 *
 * Buraya SADECE şu iki durumda kayıt eklenir:
 *   1) Uç nokta size ait (kendi ürününüz / kendi servisiniz), veya
 *   2) Test için yazılı izniniz ya da geçerli bir bug-bounty kapsamı var.
 *
 * Üçüncü taraflara ait uç noktaları buraya ekleyip istek atmak yetkisiz testtir;
 * aracın amacı bu değildir ve bu liste o yüzden boş gelir.
 */
export const AUTHORIZED_ENDPOINTS: ServiceDefinition[] = [
  // Örnek — KENDİ servisiniz:
  // {
  //   id: 'kendi-servisim',
  //   name: 'Kendi Servisim',
  //   url: 'https://api.sirketim.example/v1/auth/otp',
  //   method: 'POST',
  //   headers: { 'X-Client-Platform': 'web' },
  //   payloadInfo: '{"phoneNumber": "5XXXXXXXXX"}',
  // },
];

/**
 * @deprecated Eski ad. Artık yetkili listeye işaret eder; varsayılan olarak boştur.
 * Yeni kod `AUTHORIZED_ENDPOINTS` kullanmalı.
 */
export const TARGET_ENDPOINTS: ServiceDefinition[] = AUTHORIZED_ENDPOINTS;

const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};

/** 10 haneli ulusal forma indirger: 905XXXXXXXXX / 05XXXXXXXXX -> 5XXXXXXXXX */
function normalizePhone(raw: string): string {
  let digits = raw.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('90')) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return digits;
}

/**
 * Test edilebilecek numaralar: yalnızca kendinize ait, doğrulanmış numaralar.
 * `.env` içinde virgülle ayrılmış olarak tanımlanır:
 *   VITE_AUTHORIZED_PHONE_NUMBERS=5XXXXXXXXX
 *
 * Serbest metin girişi yoktur; araç listede olmayan bir numaraya istek atmayı reddeder.
 */
export const AUTHORIZED_PHONE_NUMBERS: string[] = (env.VITE_AUTHORIZED_PHONE_NUMBERS ?? '')
  .split(',')
  .map(normalizePhone)
  .filter(n => n.length === 10);

/** İki smoke test çalıştırması arasındaki minimum süre. */
export const RUN_COOLDOWN_MS = 60_000;

/** Uç noktalar arası bekleme (sıralı çalıştırma). */
export const STEP_DELAY_MS = 1_500;

/** Tek istek için zaman aşımı. */
export const REQUEST_TIMEOUT_MS = 10_000;

export const INITIAL_STATS = {
  totalSent: 0,
  success: 0,
  failed: 0,
  rateLimited: 0,
  sentOpaque: 0,
};
