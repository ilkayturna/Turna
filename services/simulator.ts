import { ServiceDefinition, RequestStatus, LogEntry } from '../types';

/**
 * Executes the network call via backend proxy (/api/proxy).
 * Always sends real SMS requests - no simulation mode.
 */
export const simulateNetworkCall = async (
  service: ServiceDefinition,
  targetPhone: string,
  email: string | undefined,
): Promise<LogEntry> => {
  const startTime = performance.now();

  // --- LIVE MODE (BACKEND PROXY) ---
  try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch('/api/proxy', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
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

      const payload = await response.json().catch(() => null) as {
          status?: number;
          upstreamStatus?: number;
          reachable?: boolean;
          ok?: boolean;
          error?: string;
          healed?: boolean;
          healedPayload?: any;
      } | null;
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
  } catch (error) {
      return {
          id: Math.random().toString(36).substr(2, 9),
          timestamp: new Date().toLocaleTimeString(),
          serviceName: service.name,
          status: RequestStatus.FAILED,
          message: 'Proxy connection failed',
          latency: Math.round(performance.now() - startTime),
      };
  }
};
