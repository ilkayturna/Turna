import { ServiceDefinition, RequestStatus, LogEntry } from '../types';

export async function detectLocalProxy(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const res = await fetch('http://localhost:3001/health', {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return res.ok;
  } catch {
    return false;
  }
}

async function callProxy(
  proxyUrl: string,
  service: ServiceDefinition,
  targetPhone: string,
  email: string | undefined,
  startTime: number,
): Promise<LogEntry | null> {
  try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(proxyUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
              serviceId: service.id,
              serviceUrl: service.url,
              serviceMethod: service.method,
              serviceHeaders: service.headers || {},
              targetPhone,
              email: email || '',
              initialPayload: service.payloadInfo || undefined,
          }),
          signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const payload = await response.json().catch(() => null) as any;
      const upstreamStatus = typeof payload?.upstreamStatus === 'number'
        ? payload.upstreamStatus
        : (typeof payload?.status === 'number' ? payload.status : response.status);
      const details = payload?.error ? ` - ${payload.error}` : '';
      const lastResp = payload?.lastResponse ? ` | ${payload.lastResponse}` : '';

      if (response.ok && payload?.ok) {
          return {
              id: Math.random().toString(36).substr(2, 9),
              timestamp: new Date().toLocaleTimeString(),
              serviceName: service.name,
              status: RequestStatus.SUCCESS,
              message: `200 OK | ${payload.strategy} (upstream ${upstreamStatus})`,
              latency: Math.round(performance.now() - startTime),
          };
      }

      return {
          id: Math.random().toString(36).substr(2, 9),
          timestamp: new Date().toLocaleTimeString(),
          serviceName: service.name,
          status: RequestStatus.FAILED,
          message: `${response.status} | ${payload?.strategy || 'failed'}${details}${lastResp}`,
          latency: Math.round(performance.now() - startTime),
      };
  } catch {
      return null;
  }
}

async function callDirect(
  service: ServiceDefinition,
  targetPhone: string,
  email: string | undefined,
  startTime: number,
): Promise<LogEntry> {
  try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      let payload: any;
      try {
          payload = JSON.parse((service.payloadInfo || '{}')
            .replace(/5XXXXXXXXX/g, targetPhone)
            .replace(/905XXXXXXXXX/g, `90${targetPhone}`)
            .replace(/\{\{EMAIL\}\}/g, email || 'test@test.com'));
      } catch {
          payload = { phone: targetPhone };
      }

      await fetch(service.url, {
          method: service.method || 'POST',
          headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json, text/plain, */*',
          },
          body: service.method !== 'GET' ? JSON.stringify(payload) : undefined,
          signal: controller.signal,
          mode: 'no-cors',
      });

      clearTimeout(timeoutId);
      return {
          id: Math.random().toString(36).substr(2, 9),
          timestamp: new Date().toLocaleTimeString(),
          serviceName: service.name,
          status: RequestStatus.SENT,
          message: 'Sent via browser (no-cors)',
          latency: Math.round(performance.now() - startTime),
      };
  } catch {
      return {
          id: Math.random().toString(36).substr(2, 9),
          timestamp: new Date().toLocaleTimeString(),
          serviceName: service.name,
          status: RequestStatus.FAILED,
          message: 'Browser request failed',
          latency: Math.round(performance.now() - startTime),
      };
  }
}

export const simulateNetworkCall = async (
  service: ServiceDefinition,
  targetPhone: string,
  email: string | undefined,
  localProxyAvailable: boolean,
): Promise<LogEntry> => {
  const startTime = performance.now();

  if (localProxyAvailable) {
      const localResult = await callProxy('http://localhost:3001/api/proxy', service, targetPhone, email, startTime);
      if (localResult) return localResult;
  }

  const vercelResult = await callProxy('/api/proxy', service, targetPhone, email, startTime);
  if (vercelResult) return vercelResult;

  return callDirect(service, targetPhone, email, startTime);
};
