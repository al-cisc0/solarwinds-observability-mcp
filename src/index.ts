#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import dotenv from 'dotenv';
import { SolarWindsClient } from './solarwinds-client.js';
import { SolarWindsConfig } from './types.js';

// Load .env only if environment variables are not already set
// This allows Claude Desktop's env vars to take precedence
if (!process.env.SOLARWINDS_API_TOKEN) {
  dotenv.config();
}

const GetEntitiesSchema = {
  type: z.enum(['host', 'application', 'service', 'database', 'network']).optional(),
};

const GetEntitySchema = {
  entityId: z.string(),
};

const GetMetricsSchema = {
  entityId: z.string(),
  metricNames: z.array(z.string()).optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
};

const GetAlertsSchema = {
  active: z.boolean().optional(),
};

const CreateAlertSchema = {
  name: z.string(),
  description: z.string().optional(),
  condition: z.string(),
  severity: z.enum(['critical', 'warning', 'info']),
  enabled: z.boolean().default(true),
};

const UpdateAlertSchema = {
  alertId: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
  condition: z.string().optional(),
  severity: z.enum(['critical', 'warning', 'info']).optional(),
  enabled: z.boolean().optional(),
};

const DeleteAlertSchema = {
  alertId: z.string(),
};

const GetTracesSchema = {
  serviceName: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
};

const GetTraceSchema = {
  traceId: z.string(),
};

const SearchLogsSchema = {
  query: z.string().optional(),
  groups: z.array(z.string()).optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  limit: z.number().min(1).max(1000).optional(),
};

const ListLogArchivesSchema = {
  startTime: z.string(),
  endTime: z.string(),
};

const DownloadLogArchiveSchema = {
  downloadUrl: z.string(),
  limit: z.number().min(1).max(10000).optional(),
};

async function main() {
  // Debug: Log what environment variables we received
  console.error('Environment variables received:');
  console.error('SOLARWINDS_API_URL:', process.env.SOLARWINDS_API_URL ? 'SET' : 'NOT SET');
  console.error('SOLARWINDS_API_TOKEN:', process.env.SOLARWINDS_API_TOKEN ? 'SET (length: ' + process.env.SOLARWINDS_API_TOKEN.length + ')' : 'NOT SET');
  console.error('SOLARWINDS_ORG_ID:', process.env.SOLARWINDS_ORG_ID || 'NOT SET');

  const config: SolarWindsConfig = {
    apiUrl: process.env.SOLARWINDS_API_URL || 'https://api.solarwinds.com',
    apiToken: process.env.SOLARWINDS_API_TOKEN || '',
    organizationId: process.env.SOLARWINDS_ORG_ID,
  };

  console.error('Using API URL:', config.apiUrl);

  if (!config.apiToken) {
    throw new Error('SOLARWINDS_API_TOKEN environment variable is required');
  }

  const client = new SolarWindsClient(config);

  const server = new McpServer(
    {
      name: 'solarwinds-observability-mcp',
      version: '0.1.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Register tools
  server.tool('get_entities', 'Get a list of monitored entities', GetEntitiesSchema, async (args) => {
    try {
      const entities = await client.getEntities(args.type);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(entities, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  });

  server.tool('get_entity', 'Get details of a specific entity', GetEntitySchema, async (args) => {
    try {
      const entity = await client.getEntity(args.entityId);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(entity, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  });

  server.tool('get_metrics', 'Get metrics for an entity', GetMetricsSchema, async (args) => {
    try {
      const timeRange = args.startTime && args.endTime
        ? {
            start: new Date(args.startTime),
            end: new Date(args.endTime),
          }
        : undefined;
      const metrics = await client.getMetrics(
        args.entityId,
        args.metricNames,
        timeRange
      );
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(metrics, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  });

  server.tool('get_alerts', 'Get alert definitions', GetAlertsSchema, async (args) => {
    try {
      const alerts = await client.getAlerts(args.active);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(alerts, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  });

  server.tool('create_alert', 'Create a new alert definition', CreateAlertSchema, async (args) => {
    try {
      const alert = await client.createAlert(args);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(alert, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  });

  server.tool('update_alert', 'Update an existing alert', UpdateAlertSchema, async (args) => {
    try {
      const { alertId, ...updates } = args;
      const alert = await client.updateAlert(alertId, updates);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(alert, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  });

  server.tool('delete_alert', 'Delete an alert definition', DeleteAlertSchema, async (args) => {
    try {
      await client.deleteAlert(args.alertId);
      return {
        content: [
          {
            type: 'text',
            text: `Alert ${args.alertId} deleted successfully`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  });

  server.tool('get_traces', 'Get distributed traces', GetTracesSchema, async (args) => {
    try {
      const timeRange = args.startTime && args.endTime
        ? {
            start: new Date(args.startTime),
            end: new Date(args.endTime),
          }
        : undefined;
      const traces = await client.getTraces(args.serviceName, timeRange);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(traces, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  });

  server.tool('get_trace', 'Get details of a specific trace', GetTraceSchema, async (args) => {
    try {
      const trace = await client.getTrace(args.traceId);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(trace, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  });

  server.tool('search_logs', 'Search logs with query, source groups, and/or time filtering (startTime and/or endTime)', SearchLogsSchema, async (args) => {
    try {
      // Allow startTime and endTime to be used independently or together
      const timeRange = args.startTime || args.endTime
        ? {
            start: args.startTime ? new Date(args.startTime) : undefined,
            end: args.endTime ? new Date(args.endTime) : undefined,
          }
        : undefined;
      const logs = await client.searchLogs(args.query, args.groups, timeRange, args.limit);

      // Limit the output size to prevent token overflow
      const maxLogsToShow = 10;
      const truncatedLogs = logs.slice(0, maxLogsToShow);

      // Create a summary if we have more logs than we're showing
      let summaryText = '';
      if (logs.length > maxLogsToShow) {
        summaryText = `\n\nShowing ${maxLogsToShow} of ${logs.length} total logs. `;

        // Count log levels
        const levelCounts: Record<string, number> = {};
        logs.forEach(log => {
          levelCounts[log.level] = (levelCounts[log.level] || 0) + 1;
        });

        summaryText += `Log levels: ${Object.entries(levelCounts)
          .map(([level, count]) => `${level}(${count})`)
          .join(', ')}`;
      }

      // Find the most recent exception if any
      const exceptionLogs = truncatedLogs.filter(log =>
        log.message.toLowerCase().includes('exception') ||
        log.message.toLowerCase().includes('error') ||
        log.level === 'error'
      );

      let responseText = '';

      if (exceptionLogs.length > 0) {
        responseText = `Found ${exceptionLogs.length} exception/error logs:\n\n`;
        exceptionLogs.forEach((log, index) => {
          responseText += `[${index + 1}] ${log.timestamp.toISOString()}\n`;
          responseText += `Level: ${log.level}\n`;
          responseText += `Source: ${log.source}\n`;
          responseText += `Message: ${log.message.substring(0, 500)}${log.message.length > 500 ? '...' : ''}\n`;
          if (log.attributes && Object.keys(log.attributes).length > 0) {
            const importantAttrs = ['stacktrace', 'error', 'exception', 'trace'];
            const relevantAttrs = Object.entries(log.attributes)
              .filter(([key]) => importantAttrs.some(attr => key.toLowerCase().includes(attr)))
              .slice(0, 3);
            if (relevantAttrs.length > 0) {
              responseText += `Key attributes: ${JSON.stringify(Object.fromEntries(relevantAttrs), null, 2).substring(0, 300)}\n`;
            }
          }
          responseText += '\n---\n\n';
        });
      } else if (truncatedLogs.length > 0) {
        responseText = `Found ${logs.length} logs matching query. Most recent logs:\n\n`;
        truncatedLogs.slice(0, 5).forEach((log, index) => {
          responseText += `[${index + 1}] ${log.timestamp.toISOString()} - ${log.level} - ${log.source}\n`;
          responseText += `${log.message.substring(0, 200)}${log.message.length > 200 ? '...' : ''}\n\n`;
        });
      } else {
        responseText = 'No logs found matching the query.';
      }

      responseText += summaryText;

      return {
        content: [
          {
            type: 'text',
            text: responseText,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  });

  server.tool('list_log_archives', 'List available log archive files for a time range (archives are hourly compressed JSON files stored on S3)', ListLogArchivesSchema, async (args) => {
    try {
      const archives = await client.listLogArchives(
        new Date(args.startTime),
        new Date(args.endTime)
      );

      const summaryText = `Found ${archives.length} log archive(s) for the specified time range:\n\n`;

      const archivesText = archives.map((archive, index) => {
        const sizeInMB = (archive.archiveSize / (1024 * 1024)).toFixed(2);
        const timestamp = new Date(parseInt(archive.archivedTimestamp) * 1000);
        return `[${index + 1}] ${archive.name}
  Size: ${sizeInMB} MB
  Archived: ${timestamp.toISOString()}
  Archive ID: ${archive.id}
  Download URL: ${archive.downloadUrl}`;
      }).join('\n\n');

      return {
        content: [
          {
            type: 'text',
            text: summaryText + archivesText,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  });

  server.tool('download_log_archive', 'Download and decompress a log archive file, returning parsed log entries', DownloadLogArchiveSchema, async (args) => {
    try {
      const logs = await client.downloadAndUnzipArchive(args.downloadUrl, args.limit);

      const maxLogsToShow = 10;
      const truncatedLogs = logs.slice(0, maxLogsToShow);

      let summaryText = `Successfully downloaded and decompressed archive. Total entries: ${logs.length}\n`;
      if (args.limit && logs.length >= args.limit) {
        summaryText += `(limited to first ${args.limit} entries)\n`;
      }
      summaryText += `\nShowing first ${Math.min(maxLogsToShow, logs.length)} entries:\n\n`;

      const logsText = truncatedLogs.map((log, index) => {
        return `[${index + 1}] ${log.timestamp.toISOString()} - ${log.level} - ${log.source}
${log.message.substring(0, 300)}${log.message.length > 300 ? '...' : ''}`;
      }).join('\n\n');

      // Count log levels
      const levelCounts: Record<string, number> = {};
      logs.forEach(log => {
        levelCounts[log.level] = (levelCounts[log.level] || 0) + 1;
      });

      const statsText = `\n\nLog level distribution: ${Object.entries(levelCounts)
        .map(([level, count]) => `${level}(${count})`)
        .join(', ')}`;

      return {
        content: [
          {
            type: 'text',
            text: summaryText + logsText + statsText,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  });

  // Test connection
  const connected = await client.testConnection();
  if (!connected) {
    console.error('Warning: Could not connect to SolarWinds API. Please check your credentials.');
  }

  // Start server
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('SolarWinds Observability MCP Server started');
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});