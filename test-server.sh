#!/bin/bash

# This script tests the MCP server by starting it and sending a basic initialization request

echo "Testing SolarWinds Observability MCP Server..."

# Create a temporary .env file for testing
cat > .env.test <<EOF
SOLARWINDS_API_TOKEN=test-token-123
SOLARWINDS_ORG_ID=test-org
EOF

# Test that the server can start and respond to initialization
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"clientCapabilities":{}}}' | \
  timeout 2 node dist/index.js 2>/dev/null | \
  grep -q '"result"' && echo "✓ Server started successfully" || echo "✗ Server failed to start"

# Clean up
rm -f .env.test

echo "Test complete"