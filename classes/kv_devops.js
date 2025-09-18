// classes/kv_devops.js - DevOps integration for KV API server management

import { devops } from "./devops.js";

export function createKVDevOps(baseUrl = 'http://localhost:3000') {
  return devops({
    baseUrl,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json'
    },
    endpoints: [
      // Endpoint management
      {
        name: 'list-endpoints',
        path: '/api/endpoints',
        method: 'GET',
        description: 'List all registered API endpoints',
        aliases: ['endpoints', 'ls']
      },
      {
        name: 'create-endpoint',
        path: '/api/endpoints',
        method: 'POST',
        description: 'Create new API endpoint',
        params: [
          { name: 'name', type: 'body', required: true },
          { name: 'path', type: 'body', required: true },
          { name: 'method', type: 'body', required: true },
          { name: 'description', type: 'body' },
          { name: 'auth', type: 'body', default: false },
          { name: 'response_data', type: 'body' },
          { name: 'response_code', type: 'body', default: 200 }
        ],
        aliases: ['create', 'new']
      },
      {
        name: 'delete-endpoint',
        path: '/api/endpoints/{id}',
        method: 'DELETE',
        description: 'Delete API endpoint',
        params: [
          { name: 'id', type: 'path', required: true }
        ],
        aliases: ['delete', 'rm']
      },

      // Data storage
      {
        name: 'get-data',
        path: '/api/data/{key}',
        method: 'GET',
        description: 'Get stored data by key',
        params: [
          { name: 'key', type: 'path', required: true }
        ],
        aliases: ['get']
      },
      {
        name: 'set-data',
        path: '/api/data/{key}',
        method: 'POST',
        description: 'Store data by key',
        params: [
          { name: 'key', type: 'path', required: true },
          { name: 'data', type: 'body', required: true }
        ],
        aliases: ['set', 'store']
      },

      // Authentication
      {
        name: 'generate-token',
        path: '/api/auth/tokens',
        method: 'POST',
        description: 'Generate API authentication token',
        params: [
          { name: 'name', type: 'body', required: true },
          { name: 'expires_in', type: 'body', default: 86400000 }
        ],
        aliases: ['token', 'auth']
      },

      // Quick endpoint templates
      {
        name: 'create-get',
        path: '/api/endpoints',
        method: 'POST',
        description: 'Quick create GET endpoint',
        params: [
          { name: 'name', type: 'body', required: true },
          { name: 'path', type: 'body', required: true }
        ],
        transform: (params) => ({
          name: params.name,
          path: params.path,
          method: 'GET',
          description: `GET endpoint for ${params.name}`,
          auth: false,
          response_data: { message: `Hello from ${params.name}` }
        }),
        aliases: ['get']
      },
      {
        name: 'create-post',
        path: '/api/endpoints',
        method: 'POST',
        description: 'Quick create POST endpoint',
        params: [
          { name: 'name', type: 'body', required: true },
          { name: 'path', type: 'body', required: true }
        ],
        transform: (params) => ({
          name: params.name,
          path: params.path,
          method: 'POST',
          description: `POST endpoint for ${params.name}`,
          auth: false,
          response_data: { message: `Data received by ${params.name}`, timestamp: new Date().toISOString() }
        }),
        aliases: ['post']
      }
    ]
  });
}

// Extended DevOpsChat for KV management
export class KVDevOpsChat {
  static create(options = {}) {
    const kvIntegration = createKVDevOps(options.baseUrl);
    
    // Import channel from relative path
    return import("./channel.js").then(({ channel }) => {
      const chat = channel(options.channelId || "kv-api", {
        autoScroll: true,
        maxMessages: 300,
        showTimestamps: true,
        devops: kvIntegration,
        ...options.channelConfig
      });

      // Send welcome message with KV-specific commands
      setTimeout(() => {
        chat.sendSystemMessage(
          "🗄️ **KV API Server DevOps Chat**\n\n" +
          "**Endpoint Management:**\n" +
          "• `/list-endpoints` - List all API endpoints\n" +
          "• `/create-endpoint name path method` - Create custom endpoint\n" +
          "• `/delete-endpoint id` - Delete endpoint\n" +
          "• `/get name /api/users` - Quick create GET endpoint\n" +
          "• `/post name /api/users` - Quick create POST endpoint\n\n" +
          "**Data Storage:**\n" +
          "• `/get-data key` - Retrieve stored data\n" +
          "• `/set-data key {\"data\":\"value\"}` - Store data\n\n" +
          "**Authentication:**\n" +
          "• `/generate-token name` - Create API token\n\n" +
          "**Examples:**\n" +
          "```\n" +
          "/get users /api/users\n" +
          "/create-endpoint weather /api/weather GET\n" +
          "/set-data config {\"theme\":\"dark\"}\n" +
          "/generate-token frontend-app\n" +
          "```\n\n" +
          "**Server:** " + (options.baseUrl || "http://localhost:3000")
        );
      }, 500);

      return chat;
    });
  }
}

// Helper function to create example endpoints via code
export async function setupExampleEndpoints(baseUrl = 'http://localhost:3000') {
  const endpoints = [
    {
      name: 'users',
      path: '/api/users',
      method: 'GET',
      description: 'Get list of users',
      response_data: {
        users: [
          { id: 1, name: 'Alice', role: 'admin' },
          { id: 2, name: 'Bob', role: 'user' }
        ]
      }
    },
    {
      name: 'user-create',
      path: '/api/users',
      method: 'POST',
      description: 'Create new user',
      response_data: {
        message: 'User created successfully',
        user: { id: 3, name: 'New User', role: 'user' }
      }
    },
    {
      name: 'weather',
      path: '/api/weather/{city}',
      method: 'GET',
      description: 'Get weather for city',
      response_data: {
        city: 'Oslo',
        temperature: 15,
        condition: 'Cloudy',
        timestamp: new Date().toISOString()
      }
    },
    {
      name: 'status',
      path: '/api/status',
      method: 'GET',
      description: 'API health check',
      response_data: {
        status: 'ok',
        version: '1.0.0',
        uptime: '5 minutes',
        endpoints_count: 0
      }
    }
  ];

  console.log('Setting up example endpoints...');
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${baseUrl}/api/endpoints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(endpoint)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Created endpoint: ${endpoint.name} (${endpoint.method} ${endpoint.path})`);
      } else {
        console.log(`❌ Failed to create endpoint: ${endpoint.name}`);
      }
    } catch (error) {
      console.log(`❌ Error creating endpoint ${endpoint.name}:`, error.message);
    }
  }
}