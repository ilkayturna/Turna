import { ServiceDefinition, RequestStatus, LogEntry } from '../types';
import { buildRotatingHeaders } from './proxy-core';

export async function detectLocalProxy(): Promise<boolean> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2000);
  try {
    const res = await fetch('http://localhost:3001/health', {
      method: 'GET',
      signal: controller.signal,
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function callProxy(
  proxyUrl: string,
  service: ServiceDefinition,
  targetPhone: string,
  email: string | undefined,
  startTime: number,
): Promise<LogEntry | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);
  try {
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
        fastFail: service.fastFail || false,
      }),
      signal: controller.signal,
    });

    const payload = await response.json().catch(() => null);
    const upstreamStatus =
      typeof payload?.upstreamStatus === 'number'
        ? payload.upstreamStatus
        : typeof payload?.status === 'number'
          ? payload.status
          : response.status;
    const details = payload?.error ? ` - ${payload.error}` : '';
    const lastResp = payload?.lastResponse
      ? ` | ${typeof payload.lastResponse === 'string' ? payload.lastResponse.substring(0, 150) : JSON.stringify(payload.lastResponse).substring(0, 150)}`
      : '';

    if (response.ok && payload?.ok) {
      return {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toLocaleTimeString(),
        serviceName: service.name,
        status: RequestStatus.SUCCESS,
        message: `200 OK | ${payload.strategy} (upstream ${upstreamStatus})${lastResp}`,
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
  } finally {
    clearTimeout(timeoutId);
  }
}

async function callDirect(
  service: ServiceDefinition,
  targetPhone: string,
  email: string | undefined,
  startTime: number,
): Promise<LogEntry> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  try {
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(
        (service.payloadInfo || '{}')
          .replace(/5XXXXXXXXX/g, targetPhone)
          .replace(/905XXXXXXXXX/g, `90${targetPhone}`)
          .replace(/\{\{EMAIL\}\}/g, email || 'test@test.com'),
      );
    } catch {
      payload = { phone: targetPhone } as Record<string, unknown>;
    }

    await fetch(service.url, {
      method: service.method || 'POST',
      headers: buildRotatingHeaders(),
      body: service.method !== 'GET' ? JSON.stringify(payload) : undefined,
      signal: controller.signal,
      mode: 'no-cors',
    });

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
  } finally {
    clearTimeout(timeoutId);
  }
}

export const simulateNetworkCall = async (
  service: ServiceDefinition,
  targetPhone: string,
  email: string | undefined,
  localProxyAvailable: boolean,
): Promise<LogEntry> => {
  const startTime = performance.now();

  const vercelResult = await callProxy('/api/proxy', service, targetPhone, email, startTime);
  if (vercelResult) return vercelResult;

  if (localProxyAvailable) {
    const localResult = await callProxy('http://localhost:3001/api/proxy', service, targetPhone, email, startTime);
    if (localResult) return localResult;
  }

  return callDirect(service, targetPhone, email, startTime);
};
