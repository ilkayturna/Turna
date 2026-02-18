import { ServiceDefinition, RequestStatus, LogEntry } from '../types';

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

  // --- LIVE MODE (SERVER-SIDE PROXY THROUGH VERCEL FUNCTION) ---

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

      if (response.ok) {
          return {
              id: Math.random().toString(36).substr(2, 9),
              timestamp: new Date().toLocaleTimeString(),
              serviceName: service.name,
              status: RequestStatus.SUCCESS,
              message: `200 OK | via server proxy`,
              latency: Math.round(performance.now() - startTime),
          };
      }

      return {
          id: Math.random().toString(36).substr(2, 9),
          timestamp: new Date().toLocaleTimeString(),
          serviceName: service.name,
          status: RequestStatus.FAILED,
          message: `Proxy Error (${response.status})`,
          latency: Math.round(performance.now() - startTime),
      };
  } catch (e) {
      return {
          id: Math.random().toString(36).substr(2, 9),
          timestamp: new Date().toLocaleTimeString(),
          serviceName: service.name,
          status: RequestStatus.FAILED,
          message: "Proxy connection failed",
          latency: Math.round(performance.now() - startTime),
      };
  }
};
