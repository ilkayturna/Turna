// @ts-nocheck
import type { VercelRequest, VercelResponse } from '@vercel/node';

// 1. SSL KONTROLÜNÜ GLOBAL OLARAK KAPAT (Mermiye kafa atma modu)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { serviceUrl, serviceMethod = 'GET', serviceHeaders = {}, body } = req.body || {};

    if (!serviceUrl) return res.status(400).json({ error: 'URL eksik' });

    const targetUrl = new URL(serviceUrl);

    // 2. Header Hazırlığı
    const headers = new Headers();
    // Frontend'den gelenleri ekle
    Object.entries(serviceHeaders).forEach(([k, v]) => {
        if (!['host', 'content-length', 'connection'].includes(k.toLowerCase())) {
            headers.set(k, String(v));
        }
    });

    // Stealth Headerlar
    headers.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
    headers.set('Host', targetUrl.host);
    headers.set('Origin', targetUrl.origin);
    headers.set('Referer', targetUrl.origin + '/');
    
    if (body && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }

    // 3. Body Hazırlığı
    const fetchBody = (serviceMethod !== 'GET' && serviceMethod !== 'HEAD') 
        ? (typeof body === 'string' ? body : JSON.stringify(body)) 
        : undefined;

    // 4. Native Fetch (Vercel Node 18 Runtime)
    const response = await fetch(serviceUrl, {
        method: serviceMethod,
        headers: headers,
        body: fetchBody,
        redirect: 'follow'
    });

    // 5. Yanıtı Döndür
    const responseText = await response.text();
    
    // Vercel'e Content-Type bilgisini ver
    const cType = response.headers.get('content-type');
    if (cType) res.setHeader('Content-Type', cType);

    // Upstream hatası olsa bile (403, 500) crash ettirme, yanıtı dön
    return res.status(response.status).send(responseText);

  } catch (error: any) {
    console.error('Proxy Hatası:', error);
    // Crash olursa JSON dön
    return res.status(500).json({ 
        error: 'Proxy Internal Error', 
        message: error.message 
    });
  }
}