import { ServiceDefinition, RequestStatus, LogEntry } from '../types';

/**
 * Executes the network call.
 *
 * useSimulation = TRUE  => deterministic safe simulation
 * useSimulation = FALSE => live request via backend proxy (/api/proxy)
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
        message: `200 OK | Simulated response (no live API call)`,
        latency: Math.round(performance.now() - startTime),
      };
  }

  // --- LIVE MODE (BACKEND PROXY) ---
  try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch('/api/proxy', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({
              serviceId: service.id,
              targetPhone,
              email: email || '',
          }),
          signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const payload = await response.json().catch(() => null) as {
          status?: number;
          ok?: boolean;
          error?: string;
      } | null;
      const upstreamStatus = typeof payload?.status === 'number' ? payload.status : response.status;

      if (response.ok && payload?.ok !== false) {
        return {
            id: Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toLocaleTimeString(),
            serviceName: service.name,
            status: RequestStatus.SUCCESS,
            message: `200 OK | Backend proxy (upstream ${upstreamStatus})`,
            latency: Math.round(performance.now() - startTime),
        };
      }

      if (response.status === 404) {
        return {
            id: Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toLocaleTimeString(),
            serviceName: service.name,
            status: RequestStatus.FAILED,
            message: 'Proxy endpoint missing (404): deploy project root, not only dist',
            latency: Math.round(performance.now() - startTime),
        };
      }

      const details = payload?.error ? ` - ${payload.error}` : '';
      return {
          id: Math.random().toString(36).substr(2, 9),
          timestamp: new Date().toLocaleTimeString(),
          serviceName: service.name,
          status: RequestStatus.FAILED,
          message: `Proxy Error (${upstreamStatus})${details}`,
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
