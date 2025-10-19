import axios, { AxiosInstance } from 'axios';
import { createGunzip } from 'zlib';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import https from 'https';
import { URL } from 'url';
import { SolarWindsConfig, Entity, AlertDefinition, MetricData, Trace, LogEntry, LogArchive } from './types.js';

export class SolarWindsClient {
  private client: AxiosInstance;
  private config: SolarWindsConfig;

  constructor(config: SolarWindsConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.apiUrl,
      headers: {
        'Authorization': `Bearer ${config.apiToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  async getEntities(type?: string): Promise<Entity[]> {
    try {
      const params: any = {};
      if (type) params.type = type;

      const response = await this.client.get('/v1/entities', { params });
      return response.data.entities || [];
    } catch (error) {
      throw new Error(`Failed to fetch entities: ${error}`);
    }
  }

  async getEntity(entityId: string): Promise<Entity> {
    try {
      const response = await this.client.get(`/v1/entities/${entityId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch entity ${entityId}: ${error}`);
    }
  }

  async getMetrics(entityId?: string, metricNames?: string[], timeRange?: { start: Date; end: Date }): Promise<MetricData[]> {
    try {
      const params: any = {};

      if (entityId) {
        params.entityId = entityId;
      }

      if (metricNames?.length) {
        params.names = metricNames.join(',');
      }

      if (timeRange) {
        params.startTime = timeRange.start.toISOString();
        params.endTime = timeRange.end.toISOString();
      }

      const response = await this.client.get('/v1/metrics', { params });

      // Transform the response to our MetricData format
      const metricsInfo = response.data.metricsInfo || [];
      return metricsInfo.map((metric: any) => ({
        name: metric.name,
        value: metric.value || 0,
        timestamp: new Date(metric.lastReportedTime),
        tags: metric.tags || {},
      }));
    } catch (error) {
      throw new Error(`Failed to fetch metrics: ${error}`);
    }
  }

  async getAlerts(active?: boolean): Promise<AlertDefinition[]> {
    try {
      // Note: SolarWinds Observability uses a different structure for alerts
      // This is a placeholder - actual implementation depends on their alert API
      const response = await this.client.get('/v1/alerts', {
        params: active !== undefined ? { active } : {}
      });
      return response.data.alerts || [];
    } catch (error: any) {
      // If alerts endpoint doesn't exist, return empty array
      if (error.response?.status === 404) {
        return [];
      }
      throw new Error(`Failed to fetch alerts: ${error}`);
    }
  }

  async createAlert(alert: Omit<AlertDefinition, 'id'>): Promise<AlertDefinition> {
    try {
      const response = await this.client.post('/v1/alerts', alert);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Alert creation not supported in current API');
      }
      throw new Error(`Failed to create alert: ${error}`);
    }
  }

  async updateAlert(alertId: string, updates: Partial<AlertDefinition>): Promise<AlertDefinition> {
    try {
      const response = await this.client.patch(`/v1/alerts/${alertId}`, updates);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Alert updates not supported in current API');
      }
      throw new Error(`Failed to update alert ${alertId}: ${error}`);
    }
  }

  async deleteAlert(alertId: string): Promise<void> {
    try {
      await this.client.delete(`/v1/alerts/${alertId}`);
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Alert deletion not supported in current API');
      }
      throw new Error(`Failed to delete alert ${alertId}: ${error}`);
    }
  }

  async getTraces(serviceName?: string, timeRange?: { start: Date; end: Date }): Promise<Trace[]> {
    try {
      const params: any = {};
      if (serviceName) params.service = serviceName;

      if (timeRange) {
        params.startTime = timeRange.start.toISOString();
        params.endTime = timeRange.end.toISOString();
      }

      const response = await this.client.get('/v1/traces', { params });
      return response.data.traces || [];
    } catch (error: any) {
      // If traces endpoint doesn't exist, return empty array
      if (error.response?.status === 404) {
        return [];
      }
      throw new Error(`Failed to fetch traces: ${error}`);
    }
  }

  async getTrace(traceId: string): Promise<Trace[]> {
    try {
      const response = await this.client.get(`/v1/traces/${traceId}`);
      return response.data.spans || [];
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Trace not found or traces not supported');
      }
      throw new Error(`Failed to fetch trace ${traceId}: ${error}`);
    }
  }

  async searchLogs(query?: string, groups?: string[], timeRange?: { start?: Date; end?: Date }, limit?: number): Promise<LogEntry[]> {
    try {
      const params: any = {
        limit: limit || 50,  // Request more logs
      };

      // Build the filter query using SolarWinds query language (based on Apache Lucene)
      const filterParts: string[] = [];

      // Add groups filter if specified (using group: syntax)
      if (groups && groups.length > 0) {
        // If multiple groups, combine with OR
        if (groups.length === 1) {
          filterParts.push(`group:${groups[0]}`);
        } else {
          // Multiple groups: (group:group1 OR group:group2)
          const groupQuery = groups.map(g => `group:${g}`).join(' OR ');
          filterParts.push(`(${groupQuery})`);
        }
      }

      // Add user query if specified
      if (query) {
        filterParts.push(query);
      }

      // Combine all filter parts with AND
      if (filterParts.length > 0) {
        params.filter = filterParts.join(' AND ');
      }

      // Add time range parameters if provided (can be independent)
      if (timeRange) {
        if (timeRange.start) {
          params.startTime = timeRange.start.toISOString();
        }
        if (timeRange.end) {
          params.endTime = timeRange.end.toISOString();
        }
      }

      console.error('Requesting logs with params:', params); // Debug log

      const response = await this.client.get('/v1/logs', { params });

      // Transform the response to our LogEntry format
      const logs = response.data.logs || response.data || [];

      // Ensure we only return the requested number of logs
      const limitedLogs = Array.isArray(logs) ? logs.slice(0, limit || 50) : [];

      return limitedLogs.map((log: any) => ({
        timestamp: new Date(log.time || log.timestamp || Date.now()),
        level: log.severity?.toLowerCase() || log.level || 'info',
        message: log.message || JSON.stringify(log).substring(0, 200),
        source: log.hostname || log.program || log.source || 'unknown',
        attributes: {
          id: log.id,
          program: log.program,
          hostname: log.hostname,
          ...(typeof log.attributes === 'object' ? log.attributes : {})
        }
      }));
    } catch (error: any) {
      console.error('Log search error:', error.response?.data || error.message);
      throw new Error(`Failed to search logs: ${error.message || error}`);
    }
  }

  async listLogArchives(startTime: Date, endTime: Date): Promise<LogArchive[]> {
    try {
      const params = {
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      };

      console.error('Requesting log archives with params:', params); // Debug log

      const response = await this.client.get('/v1/logs/archives', { params });

      const archives = response.data.logArchives || [];

      return archives.map((archive: any) => ({
        id: archive.id,
        name: archive.name,
        downloadUrl: archive.downloadUrl,
        archivedTimestamp: archive.archivedTimestamp,
        archiveSize: archive.archiveSize,
      }));
    } catch (error: any) {
      console.error('Log archives error:', error.response?.data || error.message);
      throw new Error(`Failed to list log archives: ${error.message || error}`);
    }
  }

  async downloadAndUnzipArchive(downloadUrl: string, limit?: number): Promise<LogEntry[]> {
    try {
      console.error('Downloading archive from:', downloadUrl.substring(0, 100) + '...'); // Debug log

      // Download the gzipped file using native HTTPS module
      // IMPORTANT: Do NOT use axios - even axios.create() can have global interceptors
      // Pre-signed S3 URLs must be called with NO additional headers
      const buffer = await new Promise<Buffer>((resolve, reject) => {
        const parsedUrl = new URL(downloadUrl);
        const chunks: Buffer[] = [];

        console.error('Download details:', {
          hostname: parsedUrl.hostname,
          pathname: parsedUrl.pathname.substring(0, 80),
          searchLength: parsedUrl.search.length,
          fullPathLength: (parsedUrl.pathname + parsedUrl.search).length
        });

        const request = https.get({
          hostname: parsedUrl.hostname,
          path: parsedUrl.pathname + parsedUrl.search,
          method: 'GET',
          // NO headers at all - pre-signed URL has everything in the URL
        }, (response) => {
          console.error('S3 Response:', response.statusCode, response.statusMessage);
          console.error('S3 Response Headers:', response.headers);
          if (response.statusCode !== 200) {
            reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
            return;
          }

          response.on('data', (chunk: Buffer) => chunks.push(chunk));
          response.on('end', () => resolve(Buffer.concat(chunks)));
          response.on('error', reject);
        });

        request.on('error', reject);
        request.setTimeout(120000, () => {
          request.destroy();
          reject(new Error('Download timeout after 120 seconds'));
        });
      });

      console.error('Downloaded archive, size:', buffer.byteLength, 'bytes');

      // Decompress the gzip file
      const chunks: Buffer[] = [];

      const gunzip = createGunzip();
      const readable = Readable.from(buffer);

      await pipeline(
        readable,
        gunzip,
        async function* (source) {
          for await (const chunk of source) {
            chunks.push(chunk);
          }
        }
      );

      const decompressed = Buffer.concat(chunks).toString('utf-8');
      console.error('Decompressed size:', decompressed.length, 'bytes');

      // Parse JSON - archive contains newline-delimited JSON
      const lines = decompressed.trim().split('\n');
      console.error('Total log entries in archive:', lines.length);

      const logEntries: LogEntry[] = [];
      const entriesToProcess = limit ? Math.min(limit, lines.length) : lines.length;

      for (let i = 0; i < entriesToProcess; i++) {
        try {
          const logData = JSON.parse(lines[i]);
          logEntries.push({
            timestamp: new Date(logData.time || logData.timestamp || Date.now()),
            level: logData.severity?.toLowerCase() || logData.level || 'info',
            message: logData.message || JSON.stringify(logData).substring(0, 200),
            source: logData.hostname || logData.program || logData.source || 'unknown',
            attributes: {
              id: logData.id,
              program: logData.program,
              hostname: logData.hostname,
              ...(typeof logData.attributes === 'object' ? logData.attributes : {})
            }
          });
        } catch (parseError) {
          console.error(`Failed to parse log entry ${i}:`, parseError);
        }
      }

      console.error('Successfully parsed', logEntries.length, 'log entries');
      return logEntries;
    } catch (error: any) {
      console.error('Archive download error:', error.message);
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        headers: error.response?.headers,
        url: downloadUrl.substring(0, 150)
      });
      throw new Error(`Failed to download and unzip archive: ${error.response?.status || error.message || error}`);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      // Try to get entities as a health check
      await this.client.get('/v1/entities', {
        params: { limit: 1 }
      });
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }
}