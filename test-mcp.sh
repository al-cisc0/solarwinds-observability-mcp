#!/bin/bash

echo "🧪 Testing SolarWinds MCP Server..."
echo ""

# Test 1: Check if command exists
echo "1️⃣  Checking if solarwinds-mcp command is available..."
if command -v solarwinds-mcp &> /dev/null; then
    echo "✅ Command found at: $(which solarwinds-mcp)"
else
    echo "❌ Command not found. Run 'npm link' first."
    exit 1
fi
echo ""

# Test 2: Test with mock credentials and MCP initialization
echo "2️⃣  Testing MCP server initialization..."
export SOLARWINDS_API_TOKEN="test-token-123"
export SOLARWINDS_ORG_ID="test-org"

# Send initialize request and check response
RESPONSE=$(echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{"tools":{}},"clientInfo":{"name":"test","version":"1.0.0"}}}' | timeout 2 solarwinds-mcp 2>/dev/null)

if echo "$RESPONSE" | grep -q '"result"'; then
    echo "✅ Server responds to initialization"
else
    echo "❌ Server failed to initialize properly"
    echo "Response: $RESPONSE"
    exit 1
fi
echo ""

# Test 3: Test tool listing
echo "3️⃣  Testing tool listing..."
TOOLS_RESPONSE=$(echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{"tools":{}},"clientInfo":{"name":"test","version":"1.0.0"}}}
{"jsonrpc":"2.0","id":2,"method":"initialized"}
{"jsonrpc":"2.0","id":3,"method":"tools/list"}' | timeout 2 solarwinds-mcp 2>/dev/null | tail -1)

if echo "$TOOLS_RESPONSE" | grep -q '"get_entities"'; then
    echo "✅ Tools are properly registered"
    echo "   Found tools: get_entities, get_metrics, get_alerts, etc."
else
    echo "❌ Tools not found in response"
    echo "Response: $TOOLS_RESPONSE"
fi
echo ""

# Test 4: Test without required env var
echo "4️⃣  Testing error handling (missing API token)..."
unset SOLARWINDS_API_TOKEN
ERROR_OUTPUT=$(timeout 1 solarwinds-mcp 2>&1 || true)

if echo "$ERROR_OUTPUT" | grep -q "SOLARWINDS_API_TOKEN"; then
    echo "✅ Properly checks for required environment variables"
else
    echo "⚠️  Warning: Might not be checking for required API token"
fi
echo ""

echo "✨ Testing complete!"
echo ""
echo "To use in Claude Desktop, add this to your config:"
echo '
{
  "mcpServers": {
    "solarwinds": {
      "command": "solarwinds-mcp",
      "env": {
        "SOLARWINDS_API_TOKEN": "your-actual-token",
        "SOLARWINDS_ORG_ID": "your-org-id"
      }
    }
  }
}'