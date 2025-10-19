# Testing the SolarWinds MCP Server

## Before Publishing - Local Testing

### Method 1: Quick Test with npm link

```bash
# 1. Build and link globally
npm run build
npm link

# 2. Run automated tests
./test-mcp.sh
```

### Method 2: Interactive Testing

```bash
# Run the interactive test client
node test-interactive.js
```

This will let you:
- See the actual MCP protocol messages
- Test individual tools
- Verify responses

### Method 3: Test with Claude Desktop (Recommended)

1. **Build and link the package:**
```bash
npm run build
npm link
```

2. **Find your Claude Desktop config file:**
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- Linux: `~/.config/Claude/claude_desktop_config.json`

3. **Add the MCP server configuration:**
```json
{
  "mcpServers": {
    "solarwinds-test": {
      "command": "solarwinds-mcp",
      "env": {
        "SOLARWINDS_API_TOKEN": "test-token-123",
        "SOLARWINDS_ORG_ID": "test-org"
      }
    }
  }
}
```

4. **Restart Claude Desktop**

5. **Test in Claude:**
- Open a new conversation
- You should see the SolarWinds tools available
- Try commands like: "Use the SolarWinds tools to list entities"

### Method 4: Test as if installed from npm

```bash
# Create a test directory
mkdir /tmp/test-solarwinds
cd /tmp/test-solarwinds

# Pack the package (creates a .tgz file)
cd /home/cisc0/mcp/solarwinds-observability-mcp
npm pack

# Install it in the test directory
cd /tmp/test-solarwinds
npm install -g /home/cisc0/mcp/solarwinds-observability-mcp/solarwinds-observability-mcp-*.tgz

# Test it
solarwinds-mcp --version
```

## Debugging Tips

### Check server logs
When running with Claude Desktop, check the logs:
- Open Claude Desktop Developer Tools (Cmd/Ctrl + Shift + I)
- Go to Console tab
- Look for MCP-related messages

### Test with real SolarWinds API
If you have actual SolarWinds credentials:

```bash
export SOLARWINDS_API_TOKEN="your-real-token"
export SOLARWINDS_ORG_ID="your-real-org"
solarwinds-mcp
```

Then send test requests to verify actual API integration.

### Common Issues

1. **"Command not found"**
   - Run `npm link` in the project directory
   - Check PATH includes npm global bin directory

2. **"SOLARWINDS_API_TOKEN environment variable is required"**
   - This is expected if not providing the env var
   - The server checks for required credentials on startup

3. **Server doesn't respond in Claude**
   - Check Claude Desktop config JSON syntax
   - Restart Claude Desktop after config changes
   - Check Developer Tools console for errors

## Uninstalling Test Installation

To remove the test installation:

```bash
# Remove global link
npm unlink -g solarwinds-observability-mcp

# Or if installed with npm install -g
npm uninstall -g solarwinds-observability-mcp
```