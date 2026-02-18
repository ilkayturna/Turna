// @ts-nocheck
import type { VercelRequest, VercelResponse } from '@vercel/node';
import https from 'https';

// Global agent to reuse connections and bypass SSL
const agent = new https.Agent({
  rejectUnauthorized: false,
  keepAlive: true
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // 2. Parse Input
    // Vercel parses JSON body automatically
    const { serviceUrl, serviceMethod = 'GET', serviceHeaders = {}, body } = req.body || {};

    if (!serviceUrl) {
      return res.status(400).json({ error: 'Missing serviceUrl' });
    }

    const targetUrl = new URL(serviceUrl);

    // 3. Prepare Headers (Stealth + Cleanup)
    const headers = new Headers();
    
    // Add custom headers from frontend (except forbidden ones)
    Object.entries(serviceHeaders).forEach(([key, value]) => {
      if (!['host', 'content-length', 'connection'].includes(key.toLowerCase())) {
        headers.set(key, String(value));
      }
    });

    // Stealth Overrides
    headers.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    headers.set('Origin', targetUrl.origin);
    headers.set('Referer', targetUrl.origin + '/');
    headers.set('Host', targetUrl.host);
    
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    // 4. Prepare Body
    const fetchBody = (serviceMethod !== 'GET' && serviceMethod !== 'HEAD' && body) 
      ? (typeof body === 'string' ? body : JSON.stringify(body))
      : undefined;

    // 5. Execute Fetch with SSL Bypass Agent
    const response = await fetch(serviceUrl, {
      method: serviceMethod,
      headers: headers,
      body: fetchBody,
      // @ts-ignore: Native fetch in Node 18+ accepts 'agent' in dispatcher options but simpler way for Vercel:
      dispatcher: agent, // For 'undici' (Node 18 native fetch uses undici under the hood)
      // Fallback for older node versions types
      agent: agent 
    });

    // 6. Handle Response
    const responseText = await response.text();
    const contentType = response.headers.get('content-type');
    
    if (contentType) res.setHeader('Content-Type', contentType);
    
    // Return upstream status code (even if it is 403 or 500)
    return res.status(response.status).send(responseText);

  } catch (error: any) {
    console.error('Proxy Fatal Error:', error);
    return res.status(500).json({
      error: 'Proxy Internal Error',
      message: error.message,
      stack: error.stack
    });
  }
}