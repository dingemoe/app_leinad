// deno_kv_api_server.js - Dynamic API server med KV storage

const kv = await Deno.openKv(); // Åpne KV database

// Standard endpoints som alltid er tilgjengelige
const SYSTEM_ENDPOINTS = {
  '/api/endpoints': {
    method: 'GET',
    description: 'List all registered endpoints',
    auth: false,
    handler: 'listEndpoints'
  },
  '/api/endpoints': {
    method: 'POST', 
    description: 'Create new endpoint',
    auth: false,
    handler: 'createEndpoint'
  },
  '/api/endpoints/{id}': {
    method: 'DELETE',
    description: 'Delete endpoint',
    auth: false,
    handler: 'deleteEndpoint'
  },
  '/api/data/{key}': {
    method: 'GET',
    description: 'Get data by key',
    auth: false,
    handler: 'getData'
  },
  '/api/data/{key}': {
    method: 'POST',
    description: 'Store data by key',
    auth: false,
    handler: 'setData'
  },
  '/api/auth/tokens': {
    method: 'POST',
    description: 'Generate API token',
    auth: false,
    handler: 'generateToken'
  }
};

// Middleware for auth
async function authenticate(req, endpoint) {
  if (!endpoint.auth) return true;
  
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return false;
  
  const token = authHeader.replace('Bearer ', '');
  const tokenData = await kv.get(['auth_tokens', token]);
  
  return tokenData.value !== null;
}

// Middleware for CORS
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

// Handler functions
const handlers = {
  async listEndpoints(req, params) {
    const endpoints = [];
    
    // Add system endpoints
    for (const [path, config] of Object.entries(SYSTEM_ENDPOINTS)) {
      endpoints.push({
        id: `system_${path.replace(/[^a-zA-Z0-9]/g, '_')}`,
        path,
        method: config.method,
        description: config.description,
        auth: config.auth,
        type: 'system'
      });
    }
    
    // Add custom endpoints from KV
    const iter = kv.list({ prefix: ['endpoints'] });
    for await (const entry of iter) {
      endpoints.push({
        id: entry.key[1],
        ...entry.value
      });
    }
    
    return { endpoints, count: endpoints.length };
  },

  async createEndpoint(req, params) {
    const body = await req.json();
    const { name, path, method, description, auth = false, response_data, response_code = 200 } = body;
    
    if (!name || !path || !method) {
      throw new Error('Missing required fields: name, path, method');
    }
    
    const endpointId = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const endpoint = {
      name,
      path,
      method: method.toUpperCase(),
      description: description || `Custom ${method} endpoint`,
      auth,
      response_data: response_data || { message: 'Success', endpoint: name },
      response_code,
      created_at: new Date().toISOString(),
      type: 'custom'
    };
    
    await kv.set(['endpoints', endpointId], endpoint);
    
    return {
      id: endpointId,
      ...endpoint,
      message: `Endpoint ${name} created successfully`
    };
  },

  async deleteEndpoint(req, params) {
    const { id } = params;
    
    if (id.startsWith('system_')) {
      throw new Error('Cannot delete system endpoints');
    }
    
    const endpoint = await kv.get(['endpoints', id]);
    if (!endpoint.value) {
      throw new Error('Endpoint not found');
    }
    
    await kv.delete(['endpoints', id]);
    
    return {
      message: `Endpoint ${endpoint.value.name} deleted successfully`,
      deleted: endpoint.value
    };
  },

  async getData(req, params) {
    const { key } = params;
    const data = await kv.get(['data', key]);
    
    if (!data.value) {
      throw new Error(`No data found for key: ${key}`);
    }
    
    return {
      key,
      data: data.value,
      retrieved_at: new Date().toISOString()
    };
  },

  async setData(req, params) {
    const { key } = params;
    const body = await req.json();
    
    await kv.set(['data', key], {
      ...body,
      updated_at: new Date().toISOString()
    });
    
    return {
      key,
      message: 'Data stored successfully',
      stored_at: new Date().toISOString()
    };
  },

  async generateToken(req, params) {
    const body = await req.json();
    const { name, expires_in = 86400000 } = body; // Default 24 hours
    
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + expires_in);
    
    await kv.set(['auth_tokens', token], {
      name: name || 'Unnamed token',
      created_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString()
    });
    
    return {
      token,
      name: name || 'Unnamed token',
      expires_at: expiresAt.toISOString(),
      message: 'Token generated successfully'
    };
  },

  // Handler for custom endpoints
  async customEndpoint(req, params, endpoint) {
    return {
      message: `Custom endpoint ${endpoint.name} called`,
      method: req.method,
      path: endpoint.path,
      params,
      timestamp: new Date().toISOString(),
      data: endpoint.response_data
    };
  }
};

// Route matcher with parameter extraction
function matchRoute(path, pattern) {
  const pathParts = path.split('/').filter(Boolean);
  const patternParts = pattern.split('/').filter(Boolean);
  
  if (pathParts.length !== patternParts.length) return null;
  
  const params = {};
  
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith('{') && patternParts[i].endsWith('}')) {
      const paramName = patternParts[i].slice(1, -1);
      params[paramName] = pathParts[i];
    } else if (pathParts[i] !== patternParts[i]) {
      return null;
    }
  }
  
  return params;
}

// Main request handler
async function handleRequest(req) {
  const url = new URL(req.url);
  const path = url.pathname;
  const method = req.method;

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders()
    });
  }

  try {
    // Check system endpoints first
    for (const [endpointPath, config] of Object.entries(SYSTEM_ENDPOINTS)) {
      if (config.method === method) {
        const params = matchRoute(path, endpointPath);
        if (params !== null) {
          if (!(await authenticate(req, config))) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
              status: 401,
              headers: { ...corsHeaders(), 'Content-Type': 'application/json' }
            });
          }
          
          const result = await handlers[config.handler](req, params);
          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { ...corsHeaders(), 'Content-Type': 'application/json' }
          });
        }
      }
    }

    // Check custom endpoints
    const iter = kv.list({ prefix: ['endpoints'] });
    for await (const entry of iter) {
      const endpoint = entry.value;
      if (endpoint.method === method) {
        const params = matchRoute(path, endpoint.path);
        if (params !== null) {
          if (!(await authenticate(req, endpoint))) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
              status: 401,
              headers: { ...corsHeaders(), 'Content-Type': 'application/json' }
            });
          }
          
          const result = await handlers.customEndpoint(req, params, endpoint);
          return new Response(JSON.stringify(result), {
            status: endpoint.response_code || 200,
            headers: { ...corsHeaders(), 'Content-Type': 'application/json' }
          });
        }
      }
    }

    // 404 for unmatched routes
    return new Response(JSON.stringify({ 
      error: 'Endpoint not found',
      path,
      method,
      available_endpoints: Object.keys(SYSTEM_ENDPOINTS)
    }), {
      status: 404,
      headers: { ...corsHeaders(), 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Request error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders(), 'Content-Type': 'application/json' }
    });
  }
}

// Start server
const PORT = 3000;

console.log(`🚀 Deno KV API Server starting on http://localhost:${PORT}/`);
console.log(`📊 KV Database ready`);
console.log(`\n🔧 System Endpoints:`);
console.log(`  GET  /api/endpoints       - List all endpoints`);
console.log(`  POST /api/endpoints       - Create new endpoint`);
console.log(`  DEL  /api/endpoints/{id}  - Delete endpoint`);
console.log(`  GET  /api/data/{key}      - Get stored data`);
console.log(`  POST /api/data/{key}      - Store data`);
console.log(`  POST /api/auth/tokens     - Generate API token`);
console.log(`\n💡 Use DevOps chat to create custom endpoints!`);

Deno.serve({ port: PORT }, handleRequest);