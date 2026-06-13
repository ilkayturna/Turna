export type SpeedLevel = 'safe' | 'normal' | 'aggressive' | 'max';

export const SPEED_CONFIG: Record<SpeedLevel, { maxConcurrent: number; batchDelay: number; minEndpointGap: number }> = {
  safe:       { maxConcurrent: 3,  batchDelay: 800,  minEndpointGap: 5000 },
  normal:     { maxConcurrent: 5,  batchDelay: 400,  minEndpointGap: 3000 },
  aggressive: { maxConcurrent: 8,  batchDelay: 200,  minEndpointGap: 1500 },
  max:        { maxConcurrent: 12, batchDelay: 100,  minEndpointGap: 800  },
};

export enum RequestStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  RATE_LIMITED = 'RATE_LIMITED',
  SENT = 'SENT', // Fire-and-Forget
}

export interface ServiceDefinition {
  id: string;
  name: string;
  url: string;
  method: 'POST' | 'GET';
  // Removed failureRate - We are doing live requests now
  headers?: Record<string, string>; 
  payloadInfo?: string; 
  category?: string;
  status?: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  serviceName: string;
  status: RequestStatus;
  message: string;
  latency: number;
}

export interface SimulationStats {
  totalSent: number;
  success: number;
  failed: number;
  rateLimited: number;
  sentOpaque: number;
}

export interface EndpointHealth {
  id: string;
  name: string;
  status: 'unknown' | 'working' | 'dead' | 'limited';
  upstreamStatus?: number;
}

export interface Certificate {
  id: string;
  title: string;
  issuer: string;
  date: string;
  url: string;
  count?: number;
}