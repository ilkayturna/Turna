export enum SimulationMode {
  SEQUENTIAL = 'SEQUENTIAL', // Serial Execution
  PARALLEL = 'PARALLEL',     // Concurrent Threading
}

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