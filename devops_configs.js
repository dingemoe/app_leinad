// devops_configs.js - Ferdigkonfigurerte DevOps integrasjoner

import { devops, presets } from "./classes/devops.js";

// GitHub Enterprise integrasjon
export const githubEnterprise = devops({
  baseUrl: 'https://github.company.com/api/v3',
  headers: {
    'Authorization': 'token YOUR_GITHUB_TOKEN',
    'Accept': 'application/vnd.github.v3+json'
  },
  endpoints: [
    {
      name: 'org-repos',
      path: '/orgs/{org}/repos',
      method: 'GET',
      description: 'List organization repositories',
      params: [
        { name: 'org', type: 'path', required: true },
        { name: 'type', type: 'query', default: 'all' },
        { name: 'per_page', type: 'query', default: 20 }
      ],
      aliases: ['orgr']
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
      ]
    }
  ]
});

// Jenkins integrasjon
export const jenkins = devops({
  baseUrl: 'http://jenkins.company.com:8080',
  headers: {
    'Authorization': 'Basic ' + btoa('username:api_token')
  },
  endpoints: [
    {
      name: 'jobs',
      path: '/api/json',
      method: 'GET',
      description: 'List all jobs',
      aliases: ['j']
    },
    {
      name: 'build',
      path: '/job/{job}/build',
      method: 'POST',
      description: 'Trigger job build',
      params: [
        { name: 'job', type: 'path', required: true },
        { name: 'token', type: 'query' }
      ]
    },
    {
      name: 'build-with-params',
      path: '/job/{job}/buildWithParameters',
      method: 'POST',
      description: 'Trigger parameterized build',
      params: [
        { name: 'job', type: 'path', required: true },
        { name: 'BRANCH', type: 'query', default: 'main' },
        { name: 'ENVIRONMENT', type: 'query', default: 'staging' }
      ],
      aliases: ['buildp']
    },
    {
      name: 'last-build',
      path: '/job/{job}/lastBuild/api/json',
      method: 'GET',
      description: 'Get last build info',
      params: [
        { name: 'job', type: 'path', required: true }
      ],
      aliases: ['last']
    }
  ]
});

// AWS CLI via API Gateway
export const aws = devops({
  baseUrl: 'https://api.company.com/aws',
  headers: {
    'Authorization': 'Bearer YOUR_AWS_TOKEN',
    'X-API-Key': 'YOUR_API_KEY'
  },
  endpoints: [
    {
      name: 'ec2-instances',
      path: '/ec2/instances',
      method: 'GET',
      description: 'List EC2 instances',
      params: [
        { name: 'state', type: 'query', default: 'running' },
        { name: 'region', type: 'query', default: 'us-east-1' }
      ],
      aliases: ['ec2', 'instances']
    },
    {
      name: 'lambda-functions',
      path: '/lambda/functions',
      method: 'GET',
      description: 'List Lambda functions',
      aliases: ['lambda', 'functions']
    },
    {
      name: 'invoke-lambda',
      path: '/lambda/invoke/{function}',
      method: 'POST',
      description: 'Invoke Lambda function',
      params: [
        { name: 'function', type: 'path', required: true },
        { name: 'payload', type: 'body' }
      ]
    },
    {
      name: 's3-buckets',
      path: '/s3/buckets',
      method: 'GET',
      description: 'List S3 buckets',
      aliases: ['s3', 'buckets']
    },
    {
      name: 'cloudwatch-logs',
      path: '/cloudwatch/logs/{log_group}',
      method: 'GET',
      description: 'Get CloudWatch logs',
      params: [
        { name: 'log_group', type: 'path', required: true },
        { name: 'start_time', type: 'query' },
        { name: 'lines', type: 'query', default: 100 }
      ],
      aliases: ['logs']
    }
  ]
});

// Kubernetes via kubectl proxy
export const kubernetes = devops({
  ...presets.kubernetes,
  endpoints: [
    ...presets.kubernetes.endpoints,
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
      name: 'restart',
      path: '/apis/apps/v1/namespaces/{namespace}/deployments/{deployment}',
      method: 'PATCH',
      description: 'Restart deployment',
      params: [
        { name: 'namespace', type: 'path', default: 'default' },
        { name: 'deployment', type: 'path', required: true }
      ]
    },
    {
      name: 'services',
      path: '/api/v1/services',
      method: 'GET',
      description: 'List services',
      aliases: ['svc']
    },
    {
      name: 'nodes',
      path: '/api/v1/nodes',
      method: 'GET',
      description: 'List cluster nodes',
      aliases: ['no']
    }
  ]
});

// Prometheus metrics
export const prometheus = devops({
  baseUrl: 'http://prometheus:9090/api/v1',
  endpoints: [
    {
      name: 'query',
      path: '/query',
      method: 'GET',
      description: 'Execute PromQL query',
      params: [
        { name: 'query', type: 'query', required: true },
        { name: 'time', type: 'query' }
      ],
      aliases: ['prom', 'q']
    },
    {
      name: 'query-range',
      path: '/query_range',
      method: 'GET',
      description: 'Execute range query',
      params: [
        { name: 'query', type: 'query', required: true },
        { name: 'start', type: 'query', required: true },
        { name: 'end', type: 'query', required: true },
        { name: 'step', type: 'query', default: '15s' }
      ],
      aliases: ['range']
    },
    {
      name: 'targets',
      path: '/targets',
      method: 'GET',
      description: 'List all targets',
      aliases: ['t']
    },
    {
      name: 'alerts',
      path: '/alerts',
      method: 'GET',
      description: 'List active alerts',
      aliases: ['a']
    }
  ]
});

// Docker via API
export const docker = devops({
  ...presets.docker,
  endpoints: [
    ...presets.docker.endpoints,
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
      name: 'stats',
      path: '/containers/{id}/stats',
      method: 'GET',
      description: 'Container stats',
      params: [
        { name: 'id', type: 'path', required: true },
        { name: 'stream', type: 'query', default: false }
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
      aliases: ['container-logs']
    }
  ]
});

// Grafana via API
export const grafana = devops({
  baseUrl: 'http://grafana:3000/api',
  headers: {
    'Authorization': 'Bearer YOUR_GRAFANA_TOKEN'
  },
  endpoints: [
    {
      name: 'dashboards',
      path: '/search',
      method: 'GET',
      description: 'List dashboards',
      params: [
        { name: 'query', type: 'query' },
        { name: 'type', type: 'query', default: 'dash-db' }
      ],
      aliases: ['dash']
    },
    {
      name: 'dashboard',
      path: '/dashboards/uid/{uid}',
      method: 'GET',
      description: 'Get dashboard by UID',
      params: [
        { name: 'uid', type: 'path', required: true }
      ]
    },
    {
      name: 'annotations',
      path: '/annotations',
      method: 'GET',
      description: 'List annotations',
      params: [
        { name: 'from', type: 'query' },
        { name: 'to', type: 'query' },
        { name: 'limit', type: 'query', default: 100 }
      ]
    }
  ]
});

// Eksempel på hvordan å bruke i en chat app
export function createDevOpsChat(integrations = {}) {
  const defaultIntegrations = {
    github: githubEnterprise,
    jenkins,
    aws,
    k8s: kubernetes,
    prometheus,
    docker,
    grafana
  };

  return {
    ...defaultIntegrations,
    ...integrations
  };
}

// Export alle for bruk i andre filer
export {
  githubEnterprise,
  jenkins, 
  aws,
  kubernetes,
  prometheus,
  docker,
  grafana
};