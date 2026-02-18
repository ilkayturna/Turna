// @ts-nocheck
import type { VercelRequest, VercelResponse } from '@vercel/node';

// SSL Korumasını Kapat (Mermiye Kafa Atma Modu)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. CORS Headers - Kapıları Sonuna Kadar Aç
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  // Pre-flight isteği ise hemen dön
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 2. BULLETPROOF BODY PARSING (Sorunu Çözen Kısım Burası)
    let payload;
    
    // Eğer body string ise parse et, object ise direkt kullan
    if (typeof req.body === 'string') {
        try {
            payload = JSON.parse(req.body);
        } catch (e) {
            console.error("JSON Parse Hatası:", e);
            return res.status(400).json({ error: 'Body valid bir JSON değil', received: req.body });
        }
    } else {
        payload = req.body;
    }

    // Payload'dan verileri çek
    const { serviceUrl, serviceMethod = 'GET', serviceHeaders = {}, body: targetBody } = payload || {};

    // Kontrol et: URL var mı?
    if (!serviceUrl) {
        console.error("Hata: serviceUrl bulunamadı. Gelen Payload:", payload);
        return res.status(400).json({ 
            error: 'Invalid serviceUrl', 
            details: 'Frontend serviceUrl göndermiyor veya JSON parse edilemedi.',
            receivedPayload: payload 
        });
    }

    // 3. Hedef URL ve Header Hazırlığı
    const targetUrl = new URL(serviceUrl);
    const headers = new Headers();

    // Frontend'den gelen headerları ekle
    Object.entries(serviceHeaders).forEach(([k, v]) => {
        if (!['host', 'content-length'].includes(k.toLowerCase())) {
            headers.set(k, String(v));
        }
    });

    // Stealth Headerlar (Tarayıcı Taklidi)
    headers.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
    headers.set('Host', targetUrl.host);
    headers.set('Origin', targetUrl.origin);
    headers.set('Referer', targetUrl.origin + '/');
    
    // Eğer targetBody varsa ve Content-Type yoksa JSON olarak işaretle
    if (targetBody && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }

    // 4. Hedef Body Hazırlığı
    const fetchBody = (serviceMethod !== 'GET' && serviceMethod !== 'HEAD') 
        ? (typeof targetBody === 'string' ? targetBody : JSON.stringify(targetBody)) 
        : undefined;

    // 5. Native Fetch ile İsteği At
    const response = await fetch(serviceUrl, {
        method: serviceMethod,
        headers: headers,
        body: fetchBody,
        redirect: 'follow'
    });

    // 6. Yanıtı Oku ve Dön
    const responseText = await response.text();
    const contentType = response.headers.get('content-type');
    
    if (contentType) res.setHeader('Content-Type', contentType);
    
    // Status ne olursa olsun (200, 400, 403, 500) olduğu gibi dön
    return res.status(response.status).send(responseText);

  } catch (error: any) {
    console.error('Proxy İç Hatası:', error);
    // Köfteci Yusuf gibi SSL hatası verenler buraya düşer
    return res.status(500).json({ 
        error: 'fetch failed', 
        message: error.message 
    });
  }
}