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
  headers?: Record<string, string>;
  payloadInfo?: string;
  category?: string;
  status?: string;
  /** If true, only try direct strategy (skip AI heal, variants, CSRF) — for endpoints known to work with exact payload */
  fastFail?: boolean;
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
