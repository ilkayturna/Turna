export enum SimulationMode {
  SEQUENTIAL = 'SEQUENTIAL', // Like the Python normal loop
  PARALLEL = 'PARALLEL',     // Like the Python threading logic
}

export enum RequestStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  RATE_LIMITED = 'RATE_LIMITED',
  SENT = 'SENT', // New status for Fire-and-Forget (No-CORS)
}

export interface ServiceDefinition {
  id: string;
  name: string;
  url: string;
  method: 'POST' | 'GET';
  failureRate: number; // 0-1 probability of simulated failure
  headers?: Record<string, string>; // For academic display of auth headers
  payloadInfo?: string; // Description of the JSON/Form data structure
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
  sentOpaque: number; // New stat tracker
}