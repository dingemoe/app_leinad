// kv_devops_example.js - Complete KV API management via DevOps chat

import { div, h1, h2, p, render } from "./classes/html.js";
import { KVDevOpsChat, setupExampleEndpoints } from "./classes/kv_devops.js";
import { setDefaultTheme } from "./classes/theme.js";

setDefaultTheme("dracula");

class KVApiManagerApp {
  render() {
    // Create KV DevOps chat that will be returned as a Promise
    const kvChatPromise = KVDevOpsChat.create({
      baseUrl: 'http://localhost:3000',
      channelId: 'kv-manager'
    });

    return div().dracula().className("min-h-screen bg-gray-900 text-white p-8").set([
      // Header
      div().className("mb-8").set([
        h1().className("text-3xl font-bold mb-2").text("🗄️ KV API Manager"),
        p().className("text-gray-300").text("Manage dynamic API endpoints via DevOps chat"),
        div().className("mt-4 p-4 bg-purple-900/50 rounded-lg border border-purple-500").set([
          p().className("text-sm").set([
            span().text("Server: "),
            span().className("font-mono text-green-400").text("http://localhost:3000"),
            span().text(" | Status: "),
            span().className("text-green-400").text("🟢 Running")
          ])
        ])
      ]),

      // Instructions
      div().className("mb-8 grid grid-cols-1 md:grid-cols-2 gap-6").set([
        div().className("p-4 bg-blue-900/30 rounded-lg border border-blue-500").set([
          h2().className("text-lg font-semibold mb-3").text("📋 Quick Start"),
          div().className("text-sm space-y-2 text-gray-300").set([
            p().text("1. Start the KV server: deno run -A deno_kv_api_server.js"),
            p().text("2. Use chat commands to manage endpoints"),
            p().text("3. Test your endpoints with curl or browser"),
            p().text("4. View all endpoints with /list-endpoints")
          ])
        ]),
        
        div().className("p-4 bg-green-900/30 rounded-lg border border-green-500").set([
          h2().className("text-lg font-semibold mb-3").text("🚀 Example Commands"),
          div().className("text-sm font-mono space-y-1 text-gray-300").set([
            p().text("/get users /api/users"),
            p().text("/post orders /api/orders"),
            p().text("/list-endpoints"),
            p().text("/set-data config {\"theme\":\"dark\"}"),
            p().text("/generate-token myapp")
          ])
        ])
      ]),

      // API Documentation
      div().className("mb-8").set([
        h2().className("text-xl font-semibold mb-4").text("📚 API Endpoints"),
        div().className("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4").set([
          // System endpoints
          div().className("p-4 bg-gray-800 rounded-lg border border-gray-600").set([
            h1().className("font-medium mb-2 text-blue-400").text("GET /api/endpoints"),
            p().className("text-sm text-gray-400").text("List all registered endpoints")
          ]),
          div().className("p-4 bg-gray-800 rounded-lg border border-gray-600").set([
            h1().className("font-medium mb-2 text-green-400").text("POST /api/endpoints"),
            p().className("text-sm text-gray-400").text("Create new custom endpoint")
          ]),
          div().className("p-4 bg-gray-800 rounded-lg border border-gray-600").set([
            h1().className("font-medium mb-2 text-yellow-400").text("GET /api/data/{key}"),
            p().className("text-sm text-gray-400").text("Retrieve stored data by key")
          ]),
          div().className("p-4 bg-gray-800 rounded-lg border border-gray-600").set([
            h1().className("font-medium mb-2 text-purple-400").text("POST /api/data/{key}"),
            p().className("text-sm text-gray-400").text("Store data with key")
          ]),
          div().className("p-4 bg-gray-800 rounded-lg border border-gray-600").set([
            h1().className("font-medium mb-2 text-red-400").text("DELETE /api/endpoints/{id}"),
            p().className("text-sm text-gray-400").text("Delete custom endpoint")
          ]),
          div().className("p-4 bg-gray-800 rounded-lg border border-gray-600").set([
            h1().className("font-medium mb-2 text-orange-400").text("POST /api/auth/tokens"),
            p().className("text-sm text-gray-400").text("Generate API tokens")
          ])
        ])
      ]),

      // Main chat interface - handle Promise
      div().className("border border-gray-600 rounded-lg overflow-hidden bg-gray-800").set([
        div().className("p-4 bg-gray-700 border-b border-gray-600").set([
          h2().className("text-lg font-semibold").text("💬 DevOps Command Interface"),
          p().className("text-sm text-gray-400").text("Use slash commands to manage your API endpoints")
        ]),
        
        // Chat container with Promise handling
        div().className("h-96").attr("id", "chat-container").set([
          p().className("p-4 text-gray-400").text("Loading DevOps chat...")
        ])
      ])
    ]);
  }
}

// Handle the async chat creation
async function createApp() {
  const app = new KVApiManagerApp();
  const appElement = app.render();
  
  // Create the KV chat and replace the loading message
  try {
    const kvChat = await KVDevOpsChat.create({
      baseUrl: 'http://localhost:3000',
      channelId: 'kv-manager'
    });
    
    // This would need to be handled differently in actual implementation
    // since we can't easily replace elements after rendering
    console.log("KV DevOps chat created successfully");
    
  } catch (error) {
    console.error("Failed to create KV DevOps chat:", error);
  }
  
  return appElement;
}

// Server setup instructions
console.log(`
🗄️ KV API Manager Setup Instructions:

1. Start the KV API server:
   deno run --allow-net --allow-read --allow-write deno_kv_api_server.js

2. Setup example endpoints (optional):
   Open browser console and run:
   await setupExampleEndpoints()

3. Test endpoints:
   curl http://localhost:3000/api/endpoints
   curl -X POST http://localhost:3000/api/endpoints \\
     -H "Content-Type: application/json" \\
     -d '{"name":"test","path":"/api/test","method":"GET"}'

4. Use DevOps chat commands:
   /list-endpoints
   /get myapi /api/myapi
   /set-data config {"theme":"dark"}

🚀 Ready to manage your dynamic API!
`);

// For Deno serve - simplified version without Promise handling
if (typeof Deno !== 'undefined') {
  Deno.serve(async (req) => {
    // Setup example endpoints on first request
    if (req.url.includes('setup-examples')) {
      await setupExampleEndpoints();
      return new Response('Example endpoints created!', { 
        headers: { 'Content-Type': 'text/plain' } 
      });
    }
    
    return render(new KVApiManagerApp(), {
      title: "KV API Manager - DevOps Chat",
      scripts: [
        "https://cdn.tailwindcss.com"
      ]
    });
  });
}

export default KVApiManagerApp;