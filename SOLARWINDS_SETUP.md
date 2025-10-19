# SolarWinds API Setup Guide

## SolarWinds Products & Their APIs

SolarWinds has several products with different APIs:

### 1. **SolarWinds Observability (SaaS)**
- **API Base URL**: `https://api.solarwinds.com` or `https://api.{region}.solarwinds.com`
- **Auth**: API Token
- **Docs**: https://documentation.solarwinds.com/en/success-center/observability/

### 2. **AppOptics (Legacy)**
- **API Base URL**: `https://api.appoptics.com/v1/`
- **Auth**: API Token
- **Docs**: https://docs.appoptics.com/api/

### 3. **SolarWinds Orion Platform (On-Premise)**
- **API Base URL**: `https://your-orion-server:17778/SolarWinds/InformationService/v3/Json/`
- **Auth**: Basic Auth or Certificate
- **Docs**: https://github.com/solarwinds/OrionSDK

## Getting Your API Credentials

### For SolarWinds Observability (SaaS)

1. Log in to your SolarWinds Observability portal
2. Navigate to **Settings** → **API Tokens**
3. Click **Create API Token**
4. Give it a name and select permissions
5. Copy the token (you won't see it again!)

### For AppOptics

1. Log in to AppOptics
2. Go to **Organization** → **API Tokens**
3. Create a new token with appropriate permissions

### For Orion Platform

1. Use your Orion username/password
2. Or set up certificate-based authentication

## Configuration

Based on your SolarWinds product, configure authentication in `~/.claude.json`:

### SolarWinds Observability (SaaS)
```json
{
  "mcpServers": {
    "solarwinds-observability": {
      "command": "solarwinds-mcp",
      "env": {
        "SOLARWINDS_API_URL": "https://api.na-01.cloud.solarwinds.com",
        "SOLARWINDS_API_TOKEN": "your-token-here",
        "SOLARWINDS_ORG_ID": "your-org-id"
      }
    }
  }
}
```

### AppOptics
```json
{
  "mcpServers": {
    "solarwinds-observability": {
      "command": "solarwinds-mcp",
      "env": {
        "SOLARWINDS_API_URL": "https://api.appoptics.com/v1",
        "SOLARWINDS_API_TOKEN": "your-appoptics-token"
      }
    }
  }
}
```

### Orion Platform
```json
{
  "mcpServers": {
    "solarwinds-observability": {
      "command": "solarwinds-mcp",
      "env": {
        "SOLARWINDS_API_URL": "https://your-orion-server:17778/SolarWinds/InformationService/v3/Json",
        "SOLARWINDS_API_TOKEN": "username:password"
      }
    }
  }
}
```

## Quick Setup (Recommended)

Instead of manually editing the configuration file, use the setup wizard:

```bash
solarwinds-mcp-setup
```

This will:
1. Prompt you for your credentials
2. Test the connection
3. Automatically update `~/.claude.json`
4. Remind you to restart Claude Desktop

## Testing Your Connection

After configuration, the setup wizard automatically tests the connection. To manually verify, check Claude Desktop's `/mcp` menu to see if the server is connected.

## API Endpoints to Verify

The current implementation assumes these endpoints:
- `/api/v1/entities` - List entities
- `/api/v1/metrics` - Get metrics
- `/api/v1/alerts` - Manage alerts
- `/api/v1/traces` - Distributed tracing
- `/api/v1/logs/search` - Log search

**Note**: The actual endpoints may differ based on your SolarWinds product. You may need to update `src/solarwinds-client.ts` to match your product's API.

## Common API Patterns by Product

### SolarWinds Observability (SaaS)
- RESTful API
- JSON responses
- Bearer token authentication
- Rate limiting: 1000 requests per minute

### AppOptics
- RESTful API
- Metrics-focused
- Token in header: `Authorization: Bearer {token}`

### Orion Platform
- SWIS (SolarWinds Information Service)
- SWQL queries (SQL-like)
- Different endpoint structure

## Need to Modify the Client?

If your SolarWinds product uses different endpoints, update `src/solarwinds-client.ts`:

1. Check the actual API documentation for your product
2. Update the endpoint URLs
3. Adjust the authentication method if needed
4. Rebuild: `npm run build`

## Troubleshooting

### 401 Unauthorized
- Check your API token is correct
- Verify token has necessary permissions
- Check if token has expired

### 404 Not Found
- Your SolarWinds product may use different endpoints
- Check the API documentation for correct URLs

### Connection Refused
- For on-premise, check firewall/network settings
- Verify the server URL and port

### SSL/Certificate Errors
- For on-premise with self-signed certs, you may need to set:
  ```env
  NODE_TLS_REJECT_UNAUTHORIZED=0
  ```
  (Use with caution, only for testing)