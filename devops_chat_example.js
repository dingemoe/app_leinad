// devops_chat_example.js - DevOps Chat med slash commands

import { div, h1, render } from "./classes/html.js";
import { channel } from "./classes/channel.js";
import { devops, presets } from "./classes/devops.js";
import { setDefaultTheme } from "./classes/theme.js";

setDefaultTheme("light");

class DevOpsChatApp {
  render() {
    // Opprett DevOps integrasjon med custom endpoints
    const devopsIntegration = devops({
      baseUrl: 'https://api.github.com',
      timeout: 30000,
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'DevOps-Chat-Bot'
      },
      endpoints: [
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
        }
      ]
    });

    // Legg til Docker commands
    devopsIntegration.addEndpoint({
      name: 'docker-ps',
      path: '/containers/json',
      method: 'GET',
      description: 'List Docker containers',
      aliases: ['ps'],
      // Override base URL for this endpoint
      baseUrl: 'http://localhost:2375'
    });

    // Opprett chat kanal med DevOps støtte
    const devopsChannel = channel("devops", {
      wsUrl: "ws://localhost:8080/devops",
      autoScroll: true,
      maxMessages: 200,
      devops: devopsIntegration
    });

    // Legg til team members
    devopsChannel.addUser("dev1", { name: "Alice", status: "online", role: "developer" });
    devopsChannel.addUser("ops1", { name: "Bob", status: "online", role: "devops" });
    devopsChannel.addAgent("ci", { name: "CI/CD Bot", type: "agent", status: "active" });

    // Send velkomstmelding med kommandohjelp
    setTimeout(() => {
      devopsChannel.sendSystemMessage(
        "🚀 **DevOps Chat aktiv!**\n\n" +
        "**Tilgjengelige kommandoer:**\n" +
        "• `/help` - Vis alle kommandoer\n" +
        "• `/repos` - List repositories\n" +
        "• `/repo owner repo` - Repository detaljer\n" +
        "• `/issues owner repo` - List issues\n" +
        "• `/pr owner repo` - List pull requests\n" +
        "• `/commits owner repo` - List commits\n" +
        "• `/deploy owner repo branch` - Deploy til produksjon\n" +
        "• `/status` - API status\n\n" +
        "**Eksempler:**\n" +
        "```\n" +
        "/repos --per_page=5\n" +
        "/issues microsoft vscode --state=closed\n" +
        "/deploy myorg myapp main --environment=staging\n" +
        "```"
      );

      // Simuler noen meldinger
      setTimeout(() => {
        devopsChannel._addMessage({
          id: "sim1",
          type: "message",
          text: "Hei team! Kan noen sjekke siste commits på main branch?",
          timestamp: Date.now(),
          sender: { id: "dev1", name: "Alice", type: "user" }
        });
      }, 2000);

      setTimeout(() => {
        devopsChannel._addMessage({
          id: "sim2",
          type: "message", 
          text: "/commits microsoft vscode",
          timestamp: Date.now(),
          sender: { id: "ops1", name: "Bob", type: "user" }
        });
      }, 4000);

    }, 1000);

    // Opprett Kubernetes kanal med preset config
    const k8sIntegration = devops({
      ...presets.kubernetes,
      baseUrl: 'http://localhost:8080/api/v1' // Custom K8s API
    });

    const k8sChannel = channel("kubernetes", {
      autoScroll: true,
      devops: k8sIntegration
    });

    k8sChannel.addAgent("kubectl", { name: "kubectl", type: "agent" });

    return div().className("devops-chat h-screen bg-gray-50").set([
      h1().className("text-2xl font-bold p-4 bg-white shadow-sm flex items-center")
        .set([
          span().text("🔧 DevOps Command Center"),
          div().className("ml-auto text-sm font-normal text-gray-500").text("Slash commands enabled")
        ]),
      
      div().className("flex h-full").set([
        // Sidebar
        div().className("w-64 bg-white border-r border-gray-200 p-4").set([
          h1().className("font-semibold mb-4").text("Channels"),
          div().className("space-y-2").set([
            div().className("p-2 rounded bg-blue-100 text-blue-800 flex items-center")
              .set([
                span().text("🔧"),
                span().className("ml-2").text("devops")
              ]),
            div().className("p-2 rounded hover:bg-gray-100 flex items-center")
              .set([
                span().text("☸️"),
                span().className("ml-2").text("kubernetes")
              ]),
            div().className("p-2 rounded hover:bg-gray-100 flex items-center")
              .set([
                span().text("🐳"),
                span().className("ml-2").text("docker")
              ])
          ]),

          div().className("mt-8").set([
            h1().className("font-semibold mb-2 text-sm text-gray-600").text("Quick Commands"),
            div().className("text-xs text-gray-500 space-y-1").set([
              div().text("/help - Show commands"),
              div().text("/status - API status"),
              div().text("/repos - List repos"),
              div().text("/issues owner repo"),
              div().text("/deploy owner repo ref")
            ])
          ])
        ]),
        
        // Main chat area
        div().className("flex-1 flex").set([
          // Active channel (devops)
          div().className("flex-1").set([devopsChannel]),
          
          // Command help sidebar
          div().className("w-80 bg-gray-50 border-l border-gray-200 p-4").set([
            h1().className("font-semibold mb-4").text("Command Reference"),
            
            div().className("space-y-4 text-sm").set([
              div().set([
                div().className("font-medium text-gray-800").text("GitHub API"),
                div().className("text-gray-600 mt-1").text("• /repos - List repositories"),
                div().className("text-gray-600").text("• /issues owner repo"),
                div().className("text-gray-600").text("• /pr owner repo"),
                div().className("text-gray-600").text("• /commits owner repo")
              ]),

              div().set([
                div().className("font-medium text-gray-800").text("Parameters"),
                div().className("text-gray-600 mt-1").text("• --state=open|closed"),
                div().className("text-gray-600").text("• --per_page=10"),
                div().className("text-gray-600").text("• --environment=prod")
              ]),

              div().set([
                div().className("font-medium text-gray-800").text("Examples"),
                div().className("bg-gray-100 p-2 rounded mt-1 font-mono text-xs").set([
                  div().text("/repos --per_page=5"),
                  div().text("/issues microsoft vscode"),
                  div().text("/deploy myorg app main")
                ])
              ])
            ])
          ])
        ])
      ])
    ]);
  }
}

// For Deno serve
if (typeof Deno !== 'undefined') {
  Deno.serve(async () => render(new DevOpsChatApp(), {
    title: "DevOps Command Center",
    scripts: [
      "https://cdn.tailwindcss.com"
    ]
  }));
}

export default DevOpsChatApp;