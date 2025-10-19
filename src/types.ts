export interface SolarWindsConfig {
  apiUrl: string;
  apiToken: string;
  organizationId?: string;
}

export interface MetricData {
  name: string;
  value: number;
  timestamp: Date;
  tags?: Record<string, string>;
}

export interface AlertDefinition {
  id: string;
  name: string;
  description?: string;
  condition: string;
  severity: 'critical' | 'warning' | 'info';
  enabled: boolean;
}

export interface Entity {
  id: string;
  type: 'host' | 'application' | 'service' | 'database' | 'network';
  name: string;
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  metrics?: MetricData[];
  metadata?: Record<string, any>;
}

export interface Trace {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  operationName: string;
  serviceName: string;
  duration: number;
  startTime: Date;
  tags?: Record<string, any>;
}

export interface LogEntry {
  timestamp: Date;
  level: 'error' | 'warn' | 'info' | 'debug' | 'trace';
  message: string;
  source: string;
  attributes?: Record<string, any>;
}

export interface LogArchive {
  id: string;
  name: string;
  downloadUrl: string;
  archivedTimestamp: string;
  archiveSize: number;
}