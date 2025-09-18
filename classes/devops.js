// classes/devops.js
// DevOps integration for Channel - slash commands for API calls

export class DevOpsIntegration {
  constructor(config = {}) {
    this.config = {
      baseUrl: config.baseUrl || 'http://localhost:3000/api',
      timeout: config.timeout || 30000,
      headers: config.headers || { 'Content-Type': 'application/json' },
      endpoints: config.endpoints || [],
      ...config
    };
    
    this.commands = new Map();
    this.aliases = new Map();
    this._registerEndpoints();
  }

  _registerEndpoints() {
    // Register all configured endpoints as commands
    this.config.endpoints.forEach(endpoint => {
      const { path, method = 'GET', name, description, params = [], flags = [] } = endpoint;
      
      this.commands.set(name, {
        path,
        method: method.toUpperCase(),
        description,
        params,
        flags,
        handler: this._createApiHandler(endpoint)
      });

      // Register aliases if provided
      if (endpoint.aliases) {
        endpoint.aliases.forEach(alias => {
          this.aliases.set(alias, name);
        });
      }
    });

    // Register built-in commands
    this._registerBuiltInCommands();
  }

  _registerBuiltInCommands() {
    this.commands.set('help', {
      description: 'Show available commands',
      handler: this._helpCommand.bind(this)
    });

    this.commands.set('status', {
      description: 'Check API status',
      handler: this._statusCommand.bind(this)
    });

    this.commands.set('config', {
      description: 'Show current configuration',
      handler: this._configCommand.bind(this)
    });
  }

  async executeCommand(commandText, channel) {
    const { command, args, flags } = this._parseCommand(commandText);
    
    // Check aliases first
    const actualCommand = this.aliases.get(command) || command;
    const commandConfig = this.commands.get(actualCommand);
    
    if (!commandConfig) {
      return this._createErrorResponse(`Unknown command: /${command}. Type /help for available commands.`);
    }

    try {
      return await commandConfig.handler(args, flags, channel);
    } catch (error) {
      return this._createErrorResponse(`Command /${command} failed: ${error.message}`);
    }
  }

  _parseCommand(text) {
    // Remove leading slash and split by spaces
    const parts = text.slice(1).trim().split(/\s+/);
    const command = parts[0];
    const remaining = parts.slice(1);
    
    const args = [];
    const flags = {};
    
    remaining.forEach(part => {
      if (part.startsWith('--')) {
        // Long flag: --key=value or --flag
        const [key, value] = part.slice(2).split('=');
        flags[key] = value || true;
      } else if (part.startsWith('-')) {
        // Short flag: -f or -f=value
        const [key, value] = part.slice(1).split('=');
        flags[key] = value || true;
      } else {
        // Regular argument
        args.push(part);
      }
    });

    return { command, args, flags };
  }

  _createApiHandler(endpoint) {
    return async (args, flags, channel) => {
      const { path, method, params = [], description } = endpoint;
      
      // Build URL with path parameters
      let url = `${this.config.baseUrl}${path}`;
      
      // Replace path parameters
      params.forEach((param, index) => {
        if (param.type === 'path' && args[index]) {
          url = url.replace(`{${param.name}}`, encodeURIComponent(args[index]));
        }
      });

      // Add query parameters
      const queryParams = new URLSearchParams();
      params.forEach((param, index) => {
        if (param.type === 'query') {
          const value = args[index] || flags[param.name] || param.default;
          if (value !== undefined) {
            queryParams.append(param.name, value);
          }
        }
      });

      if (queryParams.toString()) {
        url += '?' + queryParams.toString();
      }

      // Prepare request body for POST/PUT/PATCH
      let body = null;
      if (['POST', 'PUT', 'PATCH'].includes(method)) {
        const bodyData = {};
        params.forEach((param, index) => {
          if (param.type === 'body') {
            const value = args[index] || flags[param.name];
            if (value !== undefined) {
              bodyData[param.name] = value;
            }
          }
        });
        body = Object.keys(bodyData).length > 0 ? JSON.stringify(bodyData) : null;
      }

      // Execute request
      const startTime = Date.now();
      try {
        const response = await fetch(url, {
          method,
          headers: this.config.headers,
          body,
          signal: AbortSignal.timeout(this.config.timeout)
        });

        const duration = Date.now() - startTime;
        const responseText = await response.text();
        
        let responseData;
        try {
          responseData = JSON.parse(responseText);
        } catch {
          responseData = responseText;
        }

        return this._createApiResponse({
          command: endpoint.name,
          method,
          url,
          status: response.status,
          statusText: response.statusText,
          duration,
          data: responseData,
          success: response.ok
        });

      } catch (error) {
        const duration = Date.now() - startTime;
        return this._createErrorResponse(`API call failed: ${error.message}`, {
          command: endpoint.name,
          url,
          duration
        });
      }
    };
  }

  async _helpCommand(args, flags, channel) {
    const commands = Array.from(this.commands.entries())
      .map(([name, config]) => `/${name} - ${config.description || 'No description'}`)
      .join('\n');

    return {
      type: 'system',
      text: `Available commands:\n\`\`\`\n${commands}\n\`\`\``,
      timestamp: Date.now(),
      sender: { id: 'devops', name: 'DevOps Bot', type: 'system' }
    };
  }

  async _statusCommand(args, flags, channel) {
    try {
      const response = await fetch(`${this.config.baseUrl}/health`, {
        method: 'GET',
        headers: this.config.headers,
        signal: AbortSignal.timeout(5000)
      });

      const status = response.ok ? '🟢 Online' : '🟡 Issues';
      return {
        type: 'system',
        text: `API Status: ${status}\nBase URL: ${this.config.baseUrl}\nResponse: ${response.status} ${response.statusText}`,
        timestamp: Date.now(),
        sender: { id: 'devops', name: 'DevOps Bot', type: 'system' }
      };
    } catch (error) {
      return {
        type: 'system',
        text: `API Status: 🔴 Offline\nBase URL: ${this.config.baseUrl}\nError: ${error.message}`,
        timestamp: Date.now(),
        sender: { id: 'devops', name: 'DevOps Bot', type: 'system' }
      };
    }
  }

  async _configCommand(args, flags, channel) {
    const config = {
      baseUrl: this.config.baseUrl,
      endpoints: this.config.endpoints.length,
      commands: Array.from(this.commands.keys()),
      timeout: this.config.timeout
    };

    return {
      type: 'system',
      text: `DevOps Configuration:\n\`\`\`json\n${JSON.stringify(config, null, 2)}\n\`\`\``,
      timestamp: Date.now(),
      sender: { id: 'devops', name: 'DevOps Bot', type: 'system' }
    };
  }

  _createApiResponse({ command, method, url, status, statusText, duration, data, success }) {
    const statusIcon = success ? '✅' : '❌';
    const formattedData = typeof data === 'object' 
      ? JSON.stringify(data, null, 2) 
      : data;

    const text = `${statusIcon} **${command}** (${method})\n` +
      `**Status:** ${status} ${statusText}\n` +
      `**Duration:** ${duration}ms\n` +
      `**URL:** ${url}\n` +
      `**Response:**\n\`\`\`json\n${formattedData}\n\`\`\``;

    return {
      type: 'api_response',
      text,
      timestamp: Date.now(),
      sender: { id: 'devops', name: 'DevOps Bot', type: 'system' },
      metadata: {
        command,
        method,
        url,
        status,
        duration,
        success
      }
    };
  }

  _createErrorResponse(message, metadata = {}) {
    return {
      type: 'error',
      text: `❌ ${message}`,
      timestamp: Date.now(),
      sender: { id: 'devops', name: 'DevOps Bot', type: 'system' },
      metadata
    };
  }

  // Public method to add endpoints dynamically
  addEndpoint(endpoint) {
    this.config.endpoints.push(endpoint);
    const { name } = endpoint;
    
    this.commands.set(name, {
      ...endpoint,
      handler: this._createApiHandler(endpoint)
    });

    if (endpoint.aliases) {
      endpoint.aliases.forEach(alias => {
        this.aliases.set(alias, name);
      });
    }
  }

  // Check if a message is a command
  isCommand(text) {
    return text.startsWith('/') && text.length > 1;
  }

  // Get command suggestions for autocomplete
  getCommandSuggestions(partial = '') {
    const query = partial.toLowerCase().replace(/^\//, '');
    return Array.from(this.commands.keys())
      .filter(cmd => cmd.toLowerCase().includes(query))
      .map(cmd => `/${cmd}`);
  }
}

// Factory function
export const devops = (config) => new DevOpsIntegration(config);

// Common DevOps configurations
export const presets = {
  kubernetes: {
    baseUrl: 'http://localhost:8080/api/v1',
    endpoints: [
      {
        name: 'pods',
        path: '/pods',
        method: 'GET',
        description: 'List all pods',
        params: [
          { name: 'namespace', type: 'query', default: 'default' }
        ],
        aliases: ['p']
      },
      {
        name: 'deploy',
        path: '/deployments',
        method: 'POST',
        description: 'Create deployment',
        params: [
          { name: 'name', type: 'body', required: true },
          { name: 'image', type: 'body', required: true },
          { name: 'replicas', type: 'body', default: 1 }
        ]
      },
      {
        name: 'logs',
        path: '/pods/{pod}/logs',
        method: 'GET',
        description: 'Get pod logs',
        params: [
          { name: 'pod', type: 'path', required: true },
          { name: 'tail', type: 'query', default: 100 }
        ]
      }
    ]
  },

  docker: {
    baseUrl: 'http://localhost:2375',
    endpoints: [
      {
        name: 'containers',
        path: '/containers/json',
        method: 'GET',
        description: 'List containers',
        aliases: ['ps', 'c']
      },
      {
        name: 'images',
        path: '/images/json',
        method: 'GET',
        description: 'List images',
        aliases: ['img']
      },
      {
        name: 'build',
        path: '/build',
        method: 'POST',
        description: 'Build image',
        params: [
          { name: 't', type: 'query', required: true } // tag
        ]
      }
    ]
  },

  monitoring: {
    baseUrl: 'http://prometheus:9090/api/v1',
    endpoints: [
      {
        name: 'query',
        path: '/query',
        method: 'GET',
        description: 'PromQL query',
        params: [
          { name: 'query', type: 'query', required: true }
        ],
        aliases: ['prom', 'q']
      },
      {
        name: 'metrics',
        path: '/label/__name__/values',
        method: 'GET',
        description: 'List available metrics',
        aliases: ['m']
      }
    ]
  }
};