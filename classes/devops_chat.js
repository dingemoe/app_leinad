// classes/devops_chat.js - DevOps Chat Component med static factory

import { channel } from "./channel.js";
import { devops } from "./devops.js";

export class DevOpsChat {
  static create(options = {}) {
    const defaultEndpoints = [
      {
        name: 'repos',
        path: '/user/repos',
        method: 'GET',
        description: 'List user repositories',
        params: [
          { name: 'type', type: 'query', default: 'owner' },
          { name: 'sort', type: 'query', default: 'updated' },
          { name: 'per_page', type: 'query', default: 10 }
        ],
        aliases: ['r', 'repositories']
      },
      {
        name: 'repo',
        path: '/repos/{owner}/{repo}',
        method: 'GET',
        description: 'Get repository details',
        params: [
          { name: 'owner', type: 'path', required: true },
          { name: 'repo', type: 'path', required: true }
        ]
      },
      {
        name: 'issues',
        path: '/repos/{owner}/{repo}/issues',
        method: 'GET',
        description: 'List repository issues',
        params: [
          { name: 'owner', type: 'path', required: true },
          { name: 'repo', type: 'path', required: true },
          { name: 'state', type: 'query', default: 'open' },
          { name: 'per_page', type: 'query', default: 10 }
        ]
      },
      {
        name: 'pr',
        path: '/repos/{owner}/{repo}/pulls',
        method: 'GET',
        description: 'List pull requests',
        params: [
          { name: 'owner', type: 'path', required: true },
          { name: 'repo', type: 'path', required: true },
          { name: 'state', type: 'query', default: 'open' }
        ],
        aliases: ['pulls', 'prs']
      },
      {
        name: 'commits',
        path: '/repos/{owner}/{repo}/commits',
        method: 'GET',
        description: 'List repository commits',
        params: [
          { name: 'owner', type: 'path', required: true },
          { name: 'repo', type: 'path', required: true },
          { name: 'per_page', type: 'query', default: 10 }
        ],
        aliases: ['c']
      },
      {
        name: 'deploy',
        path: '/repos/{owner}/{repo}/deployments',
        method: 'POST',
        description: 'Create deployment',
        params: [
          { name: 'owner', type: 'path', required: true },
          { name: 'repo', type: 'path', required: true },
          { name: 'ref', type: 'body', required: true },
          { name: 'environment', type: 'body', default: 'production' },
          { name: 'description', type: 'body' }
        ]
      },
      {
        name: 'workflows',
        path: '/repos/{owner}/{repo}/actions/workflows',
        method: 'GET',
        description: 'List repository workflows',
        params: [
          { name: 'owner', type: 'path', required: true },
          { name: 'repo', type: 'path', required: true }
        ],
        aliases: ['wf']
      },
      {
        name: 'run-workflow',
        path: '/repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches',
        method: 'POST',
        description: 'Trigger workflow run',
        params: [
          { name: 'owner', type: 'path', required: true },
          { name: 'repo', type: 'path', required: true },
          { name: 'workflow_id', type: 'path', required: true },
          { name: 'ref', type: 'body', default: 'main' },
          { name: 'inputs', type: 'body' }
        ],
        aliases: ['run']
      }
    ];

    const config = {
      baseUrl: 'https://api.github.com',
      timeout: 30000,
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'DevOps-Chat-Bot'
      },
      endpoints: defaultEndpoints,
      ...options.devopsConfig
    };

    const integration = devops(config);

    const channelOptions = {
      autoScroll: true,
      maxMessages: 200,
      showTimestamps: true,
      devops: integration,
      ...options.channelConfig
    };

    const chat = channel(options.channelId || "devops", channelOptions);

    // Send welcome message with command help
    setTimeout(() => {
      chat.sendSystemMessage(
        "🚀 **DevOps Chat aktiv!**\n\n" +
        "**GitHub API kommandoer:**\n" +
        "• `/help` - Vis alle kommandoer\n" +
        "• `/repos` - List repositories\n" +
        "• `/repo owner repo` - Repository detaljer\n" +
        "• `/issues owner repo` - List issues\n" +
        "• `/pr owner repo` - List pull requests\n" +
        "• `/commits owner repo` - List commits\n" +
        "• `/deploy owner repo branch` - Deploy til produksjon\n" +
        "• `/workflows owner repo` - List workflows\n" +
        "• `/run owner repo workflow_id` - Trigger workflow\n" +
        "• `/status` - API status\n\n" +
        "**Eksempler:**\n" +
        "```\n" +
        "/repos --per_page=5\n" +
        "/issues microsoft vscode --state=closed\n" +
        "/deploy myorg myapp main --environment=staging\n" +
        "/run microsoft vscode build.yml --ref=develop\n" +
        "```"
      );
    }, 500);

    return chat;
  }

  // Factory methods for different DevOps platforms
  static createGitHub(options = {}) {
    return DevOpsChat.create({
      channelId: "github",
      devopsConfig: {
        baseUrl: 'https://api.github.com',
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'DevOps-Chat-Bot',
          'Authorization': options.token ? `token ${options.token}` : undefined
        }
      },
      ...options
    });
  }

  static createKubernetes(options = {}) {
    const k8sEndpoints = [
      {
        name: 'pods',
        path: '/api/v1/pods',
        method: 'GET',
        description: 'List all pods',
        params: [
          { name: 'namespace', type: 'query', default: 'default' }
        ],
        aliases: ['p']
      },
      {
        name: 'deployments',
        path: '/apis/apps/v1/deployments',
        method: 'GET',
        description: 'List deployments',
        aliases: ['deploy', 'd']
      },
      {
        name: 'services',
        path: '/api/v1/services',
        method: 'GET',
        description: 'List services',
        aliases: ['svc']
      },
      {
        name: 'scale',
        path: '/apis/apps/v1/namespaces/{namespace}/deployments/{deployment}/scale',
        method: 'PATCH',
        description: 'Scale deployment',
        params: [
          { name: 'namespace', type: 'path', default: 'default' },
          { name: 'deployment', type: 'path', required: true },
          { name: 'replicas', type: 'body', required: true }
        ]
      },
      {
        name: 'logs',
        path: '/api/v1/namespaces/{namespace}/pods/{pod}/log',
        method: 'GET',
        description: 'Get pod logs',
        params: [
          { name: 'namespace', type: 'path', default: 'default' },
          { name: 'pod', type: 'path', required: true },
          { name: 'tailLines', type: 'query', default: 100 }
        ]
      }
    ];

    return DevOpsChat.create({
      channelId: "kubernetes",
      devopsConfig: {
        baseUrl: options.baseUrl || 'http://localhost:8080/api/v1',
        endpoints: k8sEndpoints
      },
      ...options
    });
  }

  static createDocker(options = {}) {
    const dockerEndpoints = [
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
        name: 'start',
        path: '/containers/{id}/start',
        method: 'POST',
        description: 'Start container',
        params: [
          { name: 'id', type: 'path', required: true }
        ]
      },
      {
        name: 'stop',
        path: '/containers/{id}/stop',
        method: 'POST',
        description: 'Stop container',
        params: [
          { name: 'id', type: 'path', required: true },
          { name: 't', type: 'query', default: 10 }
        ]
      },
      {
        name: 'logs-container',
        path: '/containers/{id}/logs',
        method: 'GET',
        description: 'Container logs',
        params: [
          { name: 'id', type: 'path', required: true },
          { name: 'tail', type: 'query', default: 100 },
          { name: 'stdout', type: 'query', default: true },
          { name: 'stderr', type: 'query', default: true }
        ],
        aliases: ['logs']
      }
    ];

    return DevOpsChat.create({
      channelId: "docker",
      devopsConfig: {
        baseUrl: options.baseUrl || 'http://localhost:2375',
        endpoints: dockerEndpoints
      },
      ...options
    });
  }

  static createPrometheus(options = {}) {
    const promEndpoints = [
      {
        name: 'query',
        path: '/api/v1/query',
        method: 'GET',
        description: 'Execute PromQL query',
        params: [
          { name: 'query', type: 'query', required: true },
          { name: 'time', type: 'query' }
        ],
        aliases: ['q', 'prom']
      },
      {
        name: 'targets',
        path: '/api/v1/targets',
        method: 'GET',
        description: 'List all targets',
        aliases: ['t']
      },
      {
        name: 'alerts',
        path: '/api/v1/alerts',
        method: 'GET',
        description: 'List active alerts',
        aliases: ['a']
      },
      {
        name: 'metrics',
        path: '/api/v1/label/__name__/values',
        method: 'GET',
        description: 'List available metrics',
        aliases: ['m']
      }
    ];

    return DevOpsChat.create({
      channelId: "prometheus",
      devopsConfig: {
        baseUrl: options.baseUrl || 'http://prometheus:9090',
        endpoints: promEndpoints
      },
      ...options
    });
  }

  // KV API Chat for dynamic endpoint management
  static createKVAPIChat(options = {}) {
    const kvEndpoints = [
      {
        name: 'get',
        path: '/{name}/{path}',
        method: 'GET',
        description: 'Create GET endpoint',
        params: [
          { name: 'name', type: 'path', required: true },
          { name: 'path', type: 'path', required: true }
        ]
      },
      {
        name: 'post',
        path: '/{name}/{path}',
        method: 'POST',
        description: 'Create POST endpoint',
        params: [
          { name: 'name', type: 'path', required: true },
          { name: 'path', type: 'path', required: true }
        ]
      },
      {
        name: 'list-endpoints',
        path: '/api/endpoints',
        method: 'GET',
        description: 'List all endpoints',
        aliases: ['list', 'endpoints']
      },
      {
        name: 'create-endpoint',
        path: '/api/endpoints',
        method: 'POST',
        description: 'Create custom endpoint',
        params: [
          { name: 'name', type: 'body', required: true },
          { name: 'path', type: 'body', required: true },
          { name: 'method', type: 'body', required: true }
        ]
      },
      {
        name: 'set-data',
        path: '/api/data/{key}',
        method: 'POST',
        description: 'Store data by key',
        params: [
          { name: 'key', type: 'path', required: true },
          { name: 'data', type: 'body', required: true }
        ]
      },
      {
        name: 'get-data',
        path: '/api/data/{key}',
        method: 'GET',
        description: 'Get data by key',
        params: [
          { name: 'key', type: 'path', required: true }
        ]
      },
      {
        name: 'generate-token',
        path: '/api/auth/tokens',
        method: 'POST',
        description: 'Generate API token',
        params: [
          { name: 'name', type: 'body', required: true }
        ]
      }
    ];

    return DevOpsChat.create({
      channelId: options.channelName || "kv-api",
      devopsConfig: {
        baseUrl: options.kvServerUrl || 'http://localhost:3000',
        endpoints: kvEndpoints
      },
      theme: options.theme || 'dracula',
      ...options
    });
  }

  // GitHub Chat shorthand
  static createGitHubChat(options = {}) {
    return DevOpsChat.createGitHub({
      channelId: options.channelName || "github-ops",
      owner: options.owner || 'dingemoe',
      repo: options.repo || 'app_leinad',
      ...options
    });
  }
}