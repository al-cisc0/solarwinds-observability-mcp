# SolarWinds Observability MCP Server

An MCP (Model Context Protocol) server implementation for integrating with SolarWinds Observability platform. This server provides tools for monitoring entities, managing alerts, searching logs, and analyzing distributed traces.

## Features

- **Entity Management**: List and retrieve details of monitored entities (hosts, applications, services, databases, networks)
- **Metrics Collection**: Fetch performance metrics for specific entities with time range filtering
- **Alert Management**: Create, update, delete, and list alert definitions
- **Distributed Tracing**: Access and analyze trace data across services
- **Log Search**: Search and retrieve logs with powerful query capabilities

## Installation

### Global Installation (Recommended)

Install the MCP server globally using npm:

```bash
# Install globally from npm
npm install -g @cisc0/solarwinds-observability-mcp

# Or install from source
git clone https://github.com/al-cisc0/solarwinds-observability-mcp.git
cd solarwinds-observability-mcp
npm install
npm run build
npm link
```

### Local Installation

For development or local use:

```bash
git clone https://github.com/al-cisc0/solarwinds-observability-mcp.git
cd solarwinds-observability-mcp
npm install
npm run build
```

## Configuration

Edit your Claude configuration file at `~/.claude.json` and add:

```json
{
  "mcpServers": {
    "solarwinds-observability": {
      "command": "solarwinds-mcp",
      "env": {
        "SOLARWINDS_API_TOKEN": "your-api-token-here",
        "SOLARWINDS_ORG_ID": "your-org-id-here",
        "SOLARWINDS_API_URL": "https://api.na-01.cloud.solarwinds.com"
      }
    }
  }
}
```

**Important:**
- Replace `your-api-token-here` with your actual SolarWinds API token
- Adjust the API URL to match your SolarWinds region (e.g., `na-01`, `eu-01`)
- Restart Claude Code after updating the configuration

**Getting your API credentials:**
1. Log in to your SolarWinds Observability portal
2. Navigate to **Settings** → **API Tokens**
3. Click **Create API Token**
4. Copy the token immediately (you won't see it again!)

## Building

```bash
npm run build
```

## Running the Server

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

## Available Tools

### Entity Operations

- **get_entities**: List all monitored entities with optional type filtering
- **get_entity**: Get detailed information about a specific entity

### Metrics

- **get_metrics**: Retrieve metrics for an entity with optional metric name and time range filtering

### Alert Management

- **get_alerts**: List alert definitions with optional active status filtering
- **create_alert**: Create a new alert definition
- **update_alert**: Update an existing alert
- **delete_alert**: Remove an alert definition

### Tracing

- **get_traces**: List distributed traces with optional service and time filtering
- **get_trace**: Get detailed span information for a specific trace

### Logs

- **search_logs**: Search logs using query expressions, source groups, time filtering and limit options
  - Supports fulltext search via the `query` parameter
  - Supports filtering by source groups via the `groups` parameter
  - Supports time filtering via `startTime` and/or `endTime` parameters (ISO 8601 format)
  - Can combine query, groups, and time filters for refined searches
  - Automatically searches both live logs and archived logs based on time range

- **list_log_archives**: List available log archive files for a specific time range
  - Returns hourly compressed JSON archive files stored on Amazon S3
  - Each archive includes download URL, file size, and archived timestamp
  - Archives are retained for up to one year
  - Use for downloading raw log data or bulk log analysis

- **download_log_archive**: Download and decompress a log archive file
  - Takes a download URL (from `list_log_archives`) and optional limit parameter
  - Downloads the gzip-compressed archive from S3
  - Automatically decompresses and parses the newline-delimited JSON format
  - Returns parsed log entries with full details
  - Supports limiting the number of entries processed (default: all entries)
  - **⚠️ Important**: Download URLs expire after 24 hours - use them promptly after getting them from `list_log_archives`
  - Useful for offline analysis or bulk log processing

## Log Search, Archives, and Source Groups

SolarWinds Observability supports comprehensive log management including real-time search, archive access, and source group filtering.

### Log Archives

SolarWinds Observability automatically archives logs every hour to compressed JSON files stored on Amazon S3. Archives are retained for up to one year and can be accessed in multiple ways:
- **Searched automatically**: The `search_logs` tool searches both live and archived logs seamlessly
- **Listed**: The `list_log_archives` tool provides pre-signed S3 URLs for raw archive files
- **Downloaded and processed**: The `download_log_archive` tool downloads, decompresses, and parses archive files automatically

### Source Groups

**Source Groups** are logical collections of log sources that help segment large amounts of disparate data.

### Query Syntax

The log search uses Apache Lucene-based query syntax with the following features:

- **Fulltext search**: Search for keywords across all log messages
- **Field filters**: Filter by specific fields (e.g., `level:error`, `hostname:prod-server`)
- **Source groups**: Filter by predefined source groups using `group:groupname`
- **Query grouping**: Use parentheses to group terms (e.g., `(error OR warning) AND group:production`)
- **Boolean operators**: AND, OR, NOT for combining search terms

### Combining Filters

The MCP server automatically combines your search parameters:

**Groups:**
- Multiple groups are combined with OR: `(group:staging OR group:production)`
- Query and groups are combined with AND: `(group:staging OR group:production) AND error`

**Time Filtering:**
- `startTime` alone: Returns logs from that time onwards
- `endTime` alone: Returns logs up to that time
- Both together: Returns logs within that specific time range
- Time format: ISO 8601 (e.g., `"2025-10-18T22:30:00Z"`)
- Time filters work independently of query and groups filters

## Example Usage

Once connected through an MCP client, you can use the tools like:

```
# List all hosts
get_entities(type: "host")

# Get metrics for a specific entity
get_metrics(entityId: "entity-123", metricNames: ["cpu.usage", "memory.usage"])

# Search logs with fulltext query
search_logs(query: "error level:error service:api", limit: 50)

# Search logs by source groups
search_logs(groups: ["production", "api-servers"], limit: 50)

# Search logs with both query and groups
search_logs(
  query: "error",
  groups: ["staging"],
  limit: 100
)

# Search logs from a specific time onwards
search_logs(
  query: "error",
  startTime: "2025-10-18T22:00:00Z",
  limit: 50
)

# Search logs up to a specific time
search_logs(
  groups: ["production"],
  endTime: "2025-10-18T23:00:00Z",
  limit: 50
)

# Search logs within a specific time range
search_logs(
  query: "exception",
  startTime: "2025-10-18T22:30:00Z",
  endTime: "2025-10-18T23:00:00Z",
  limit: 100
)

# Combine all filters: query, groups, and time range
search_logs(
  query: "error OR warning",
  groups: ["staging", "production"],
  startTime: "2025-10-18T22:00:00Z",
  endTime: "2025-10-18T23:00:00Z",
  limit: 200
)

# List log archives for a time range
list_log_archives(
  startTime: "2025-10-18T14:00:00Z",
  endTime: "2025-10-18T16:00:00Z"
)

# Download and decompress a specific archive
download_log_archive(
  downloadUrl: "https://ssp-prod-dc-01-log-archives.s3.us-east-2.amazonaws.com/...",
  limit: 1000  # Optional: limit number of entries to process
)

# Search archived logs (searches automatically - same as live logs)
search_logs(
  query: "error",
  startTime: "2025-10-17T00:00:00Z",
  endTime: "2025-10-17T23:59:59Z",
  limit: 100
)

# Create an alert
create_alert(
  name: "High CPU Usage",
  condition: "cpu.usage > 90",
  severity: "critical",
  enabled: true
)
```

## API Types

The server uses TypeScript interfaces for strong typing:

- `Entity`: Represents monitored infrastructure components
- `MetricData`: Time-series metric data points
- `AlertDefinition`: Alert configuration and rules
- `Trace`: Distributed tracing spans
- `LogEntry`: Structured log entries

## Error Handling

The server includes comprehensive error handling with descriptive messages for:
- API connection failures
- Invalid parameters
- Authentication issues
- Rate limiting
- Network timeouts

## Development

### Project Structure

```
src/
├── index.ts              # Main server implementation
├── solarwinds-client.ts  # SolarWinds API client
└── types.ts              # TypeScript type definitions
```

### Adding New Tools

1. Define the tool schema in `index.ts`
2. Add the tool to the tools list
3. Implement the handler in the switch statement
4. Add corresponding method in `solarwinds-client.ts`

## License

MIT