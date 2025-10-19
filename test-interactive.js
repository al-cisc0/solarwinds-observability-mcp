#!/usr/bin/env node

import { spawn } from 'child_process';
import { createInterface } from 'readline';

console.log('🚀 Interactive SolarWinds MCP Test Client\n');

// Set test environment variables
process.env.SOLARWINDS_API_TOKEN = process.env.SOLARWINDS_API_TOKEN || 'test-token-123';
process.env.SOLARWINDS_ORG_ID = process.env.SOLARWINDS_ORG_ID || 'test-org';

console.log('Starting MCP server with test credentials...\n');

const mcp = spawn('solarwinds-mcp', [], {
  env: process.env,
  stdio: ['pipe', 'pipe', 'pipe']
});

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

let requestId = 1;

// Handle server output
mcp.stdout.on('data', (data) => {
  const lines = data.toString().split('\n').filter(line => line.trim());
  lines.forEach(line => {
    try {
      const response = JSON.parse(line);
      console.log('📥 Response:', JSON.stringify(response, null, 2));
    } catch (e) {
      // Not JSON, just print it
      if (line.trim()) console.log('📥 Server:', line);
    }
  });
});

mcp.stderr.on('data', (data) => {
  console.log('⚠️ Server log:', data.toString());
});

// Send a request to the server
function sendRequest(method, params = {}) {
  const request = {
    jsonrpc: '2.0',
    id: requestId++,
    method,
    params
  };
  console.log('📤 Sending:', JSON.stringify(request, null, 2));
  mcp.stdin.write(JSON.stringify(request) + '\n');
}

// Initialize the connection
console.log('Initializing MCP connection...\n');
sendRequest('initialize', {
  protocolVersion: '2024-11-05',
  capabilities: { tools: {} },
  clientInfo: { name: 'test-client', version: '1.0.0' }
});

// Wait a bit for initialization, then send initialized
setTimeout(() => {
  sendRequest('initialized');

  // Show menu
  setTimeout(() => {
    console.log('\n📋 Available commands:');
    console.log('  1. List tools');
    console.log('  2. Test get_entities');
    console.log('  3. Test get_alerts');
    console.log('  4. Test search_logs');
    console.log('  5. Exit');
    console.log('\nEnter command number: ');

    rl.on('line', (input) => {
      switch(input.trim()) {
        case '1':
          sendRequest('tools/list');
          break;
        case '2':
          sendRequest('tools/call', {
            name: 'get_entities',
            arguments: { type: 'host' }
          });
          break;
        case '3':
          sendRequest('tools/call', {
            name: 'get_alerts',
            arguments: { active: true }
          });
          break;
        case '4':
          sendRequest('tools/call', {
            name: 'search_logs',
            arguments: {
              query: 'error',
              limit: 10
            }
          });
          break;
        case '5':
          console.log('Exiting...');
          mcp.kill();
          process.exit(0);
          break;
        default:
          console.log('Invalid option. Please enter 1-5.');
      }

      setTimeout(() => {
        console.log('\nEnter command number: ');
      }, 500);
    });
  }, 500);
}, 500);

// Handle exit
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  mcp.kill();
  process.exit(0);
});