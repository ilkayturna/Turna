import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import https from 'https';

// 1. Her site için ayrı bir Çerez Kavanozu (Cookie Jar) oluşturuyoruz
// Not: Globalde tutmak Vercel'in "warm start" durumlarında session'ı korumasını sağlar
const cookieJar = new CookieJar();
const client = wrapper(axios.create({ 
  jar: cookieJar,
  withCredentials: true 
}));

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Ayarları
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { serviceUrl, serviceMethod, serviceHeaders, body } = req.body;

    if (!serviceUrl) return res.status(400).json({ error: 'serviceUrl eksik.' });

    const targetUrl = new URL(serviceUrl);

    // 2. SSL/TLS Bypass & Fingerprint Optimization
    const agent = new https.Agent({
      rejectUnauthorized: false, // SSL Sertifika kontrollerini tamamen kapatır
      ciphers: 'TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:TLS_AES_128_GCM_SHA256', // Modern Chrome Ciphers
      minVersion: 'TLSv1.2'
    });

    // 3. Header Spoofing (Sadece UA değil, tüm tarayıcı setini taklit eder)
    const finalHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Sec-Ch-Ua': '"Not A(A:Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-site',
      'Host': targetUrl.host,
      'Origin': targetUrl.origin,
      'Referer': targetUrl.origin + '/',
      ...serviceHeaders // Frontend'den gelen özel Token/Auth bilgilerini ekler
    };

    // 4. İsteği Yürütme
    const response = await client({
      url: serviceUrl,
      method: serviceMethod || 'GET',
      data: body,
      headers: finalHeaders,
      httpsAgent: agent,
      validateStatus: () => true, // Tüm HTTP kodlarını (400, 500 vb.) hata fırlatmadan kabul et
      timeout: 20000,
      maxRedirects: 5,
      responseType: 'text' // Ham veriyi bozmamak için
    });

    // 5. Karşı taraftan gelen çerezleri frontend'e veya sonraki isteğe pasla
    // Axios-cookiejar-support bunu arka planda 'cookieJar' içine kaydeder.

    // Content-Type koruması
    if (response.headers['content-type']) {
      res.setHeader('Content-Type', response.headers['content-type']);
    }

    console.log(`[Bypass Success] ${serviceMethod} -> ${serviceUrl} Status: ${response.status}`);
    
    return res.status(response.status).send(response.data);

  } catch (error: any) {
    console.error(`[Critical Bypass Error]`, error.message);
    return res.status(502).json({
      error: 'Proxy Bypass Failed',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}