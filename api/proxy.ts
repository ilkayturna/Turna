// @ts-nocheck
import https from 'https';
import http from 'http';
import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // 1. Standart CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');

    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        const { serviceUrl, serviceMethod = 'GET', serviceHeaders = {}, body } = req.body;
        if (!serviceUrl) return res.status(400).json({ error: 'serviceUrl eksik.' });

        const targetUrl = new URL(serviceUrl);
        const requestBody = typeof body === 'object' ? JSON.stringify(body) : (body || '');

        // 2. "Asla Patlamayan" İstek Ayarları
        const options = {
            hostname: targetUrl.hostname,
            port: targetUrl.port || (targetUrl.protocol === 'https:' ? 443 : 80),
            path: targetUrl.pathname + targetUrl.search,
            method: serviceMethod.toUpperCase(),
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Content-Type': 'application/json',
                'Accept': 'application/json, text/plain, */*',
                'Host': targetUrl.host,
                'Origin': targetUrl.origin,
                'Referer': targetUrl.origin + '/',
                ...serviceHeaders
            },
            rejectUnauthorized: false, // SSL barajını yıkar geçer
            timeout: 15000
        };

        // 3. Node Native Request (Kütüphanesiz, Saf Güç)
        const proxyReq = (targetUrl.protocol === 'https:' ? https : http).request(options, (proxyRes) => {
            let resData = '';
            
            // Header'ları aynen ilet (Cookie'ler dahil)
            if (proxyRes.headers['set-cookie']) res.setHeader('Set-Cookie', proxyRes.headers['set-cookie']);
            if (proxyRes.headers['content-type']) res.setHeader('Content-Type', proxyRes.headers['content-type']);

            proxyRes.on('data', (chunk) => { resData += chunk; });
            proxyRes.on('end', () => {
                res.status(proxyRes.statusCode || 200).send(resData);
            });
        });

        proxyReq.on('error', (e) => {
            console.error("Proxy Hatası:", e.message);
            res.status(502).json({ error: 'Proxy Bypass Failed', details: e.message });
        });

        if (requestBody && options.method !== 'GET') {
            proxyReq.write(requestBody);
        }
        
        proxyReq.end();

    } catch (error: any) {
        res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
}