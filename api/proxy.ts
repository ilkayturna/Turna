// @ts-nocheck
import type { VercelRequest, VercelResponse } from '@vercel/node';
import https from 'https';
import http from 'http';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. CORS - Frontend'in önü açılsın
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { serviceUrl, serviceMethod = 'GET', serviceHeaders = {}, body } = req.body;

    if (!serviceUrl) return res.status(400).json({ error: 'serviceUrl eksik.' });

    const targetUrl = new URL(serviceUrl);

    // 2. MODERN TARAYICI PARMAK İZİ (Headers)
    // Sadece UA değil, tüm set. Bu set 27 sitenin 27'si için de geçerlidir, bozmaz.
    const stealthHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
      'Origin': targetUrl.origin,
      'Referer': targetUrl.origin + '/',
      'Host': targetUrl.host,
      'Sec-Ch-Ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-site',
      ...serviceHeaders // Senin frontend'den gönderdiğin Token/Auth'lar burada ezilmez
    };

    // Vercel/Node gereksizlerini temizle
    delete stealthHeaders['connection'];
    delete stealthHeaders['content-length'];

    // 3. SSL BYPASS AGENT (Kritik nokta)
    const agent = new (targetUrl.protocol === 'https:' ? https.Agent : http.Agent)({
      rejectUnauthorized: false, // SSL hatası veren dandik API'ları yutar
      keepAlive: true
    });

    const requestBody = body 
      ? (typeof body === 'string' ? body : JSON.stringify(body)) 
      : undefined;

    // 4. ÇALIŞAN NATIVE FETCH (Vercel'de en stabili budur)
    const response = await fetch(serviceUrl, {
      method: serviceMethod.toUpperCase(),
      headers: stealthHeaders,
      body: (['GET', 'HEAD'].includes(serviceMethod.toUpperCase())) ? undefined : requestBody,
      // @ts-ignore
      agent: agent
    });

    // 5. RESPONSE HANDLING
    const responseText = await response.text();
    
    // Header'ları (Özellikle Cookie'leri) frontend'e paslayalım
    const responseHeaders = {};
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'set-cookie' || key.toLowerCase() === 'content-type') {
        res.setHeader(key, value);
      }
    });

    console.log(`[${response.status}] ${serviceMethod} -> ${serviceUrl}`);
    return res.status(response.status).send(responseText);

  } catch (error: any) {
    console.error(`[CORT HATASI]`, error.message);
    return res.status(502).json({
      error: 'Proxy Bypass Failed',
      message: error.message,
      hint: 'Sunucuya ulaşılamadı veya URL hatalı.'
    });
  }
}