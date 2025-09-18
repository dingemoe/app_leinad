import { div, h1, h2, p, table, thead, tbody, tr, th, td, form, input, button, render, factory } from "https://raw.githubusercontent.com/dingemoe/app_leinad/6fff7712d5f64b21ec715c1110f5ffa5ae70388f/classes/html.js";
import { setDefaultTheme } from "https://raw.githubusercontent.com/dingemoe/app_leinad/6fff7712d5f64b21ec715c1110f5ffa5ae70388f/classes/theme.js";

setDefaultTheme("dracula");

// Factory functions for React compatibility - no more classes!
const DevOpsChatDemo = factory(() =>
  div().dracula().className("p-4").set([
    h2().text("🚀 KV API Management Demo"),
    p().text("DevOps kommandoer (simulert for playground):"),
    div().className("bg-gray-800 p-3 rounded mb-4 text-sm").set([
      p().className("text-green-400").text("📋 Endpoint Commands:"),
      p().text("✓ /get users /api/users - Opprett GET endpoint"),
      p().text("✓ /post orders /api/orders - Opprett POST endpoint"),
      p().text("✓ /list-endpoints - Vis alle endpoints"),
      p().text(""),
      p().className("text-blue-400").text("💾 Data Commands:"),
      p().text("✓ /set-data config {\"theme\":\"dark\"} - Lagre data"),
      p().text("✓ /get-data config - Hent data"),
      p().text(""),
      p().className("text-purple-400").text("🔐 Auth Commands:"),
      p().text("✓ /generate-token my-app - Opprett API token"),
    ]),
    
    // Chat interface simulation
    div().className("bg-gray-900 p-4 rounded-lg").set([
      div().className("bg-gray-800 p-3 rounded mb-4 h-32 overflow-y-auto").set([
        p().className("text-green-400 text-sm").text("System: KV API chat initialized 🚀"),
        p().className("text-blue-400 text-sm").text("User: /get users /api/users"),
        p().className("text-green-400 text-sm").text("Bot: ✅ Created GET endpoint: /api/users"),
        p().className("text-blue-400 text-sm").text("User: /list-endpoints"),
        p().className("text-green-400 text-sm").text("Bot: 📋 Found 1 endpoint: GET /api/users"),
      ]),
      div().className("flex gap-2").set([
        input()
          .className("flex-1 p-2 rounded bg-gray-700 text-white")
          .attr("placeholder", "Type KV command... (e.g., /get users /api/users)")
          .attr("id", "kvInput"),
        button()
          .className("bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white")
          .text("Execute")
          .click(() => {
            const input = document.getElementById('kvInput');
            const command = input.value;
            if (command.trim()) {
              console.log('🚀 KV Command:', command);
              if (command.startsWith('/')) {
                console.log('✅ Valid KV command detected');
              }
              input.value = '';
            }
          })
      ])
    ])
  ])
);

// GitHub Demo as factory function
const GitHubDevOpsDemo = factory(() =>
  div().dracula().className("p-4").set([
    h2().text("🐙 GitHub DevOps Demo"),
    p().text("GitHub API kommandoer:"),
    div().className("bg-gray-800 p-3 rounded mb-4 text-sm").set([
      p().text("✓ /repos list - List repositories"),
      p().text("✓ /issues list - List issues"),
      p().text("✓ /branches list - List branches"),
      p().text("✓ /commits list - List commits"),
    ]),
    div().className("grid grid-cols-2 gap-4").set([
      button()
        .className("bg-gray-700 hover:bg-gray-600 p-3 rounded text-white")
        .text("📚 List Repos")
        .click(() => {
          console.log('🐙 GitHub: Fetching repositories...');
          fetch('https://api.github.com/users/dingemoe/repos')
            .then(r => r.json())
            .then(repos => {
              console.log('📚 Repositories:', repos.slice(0, 3).map(r => r.name));
            })
            .catch(e => console.log('❌ GitHub API Error:', e.message));
        }),
      button()
        .className("bg-gray-700 hover:bg-gray-600 p-3 rounded text-white")
        .text("🐛 List Issues")
        .click(() => {
          console.log('🐙 GitHub: Fetching issues...');
          fetch('https://api.github.com/repos/dingemoe/app_leinad/issues')
            .then(r => r.json())
            .then(issues => {
              console.log('🐛 Issues:', issues.length, 'found');
            })
            .catch(e => console.log('❌ GitHub API Error:', e.message));
        })
    ])
  ])
);

const App = factory(() =>
  div().dracula().className("min-h-screen p-8").set([
    h1().text("🎉 DevOps Chat Demo - KV API & GitHub!"),
    
    // KV API Chat
    DevOpsChatDemo(),
    
    // Separator
    div().className("border-t border-gray-600 my-8"),
    
    // GitHub Chat  
    GitHubDevOpsDemo(),
    
    // Separator
    div().className("border-t border-gray-600 my-8"),
      
      // Original demo content
      h2().text("👤 Users (fetch demo)"),
      table().className("w-full").set([
        thead().set([
          tr().set([ 
            th().className("text-left p-2").text("Name"), 
            th().className("text-left p-2").text("Email") 
          ]),
        ]),
        tbody("https://jsonplaceholder.typicode.com/users", (u) =>
          tr().set([ 
            td().className("p-2").text(u.name ?? ""), 
            td().className("p-2").text(u.email ?? "") 
          ])
        ),
      ]),
      
      h2().text("🎮 Remote controlled input"),
      div().dracula().className("p-4 rounded-xl mt-4").set([
        form("https://jsonplaceholder.typicode.com/users/1", (user) => [
          p().text("Name (Remote Control Enabled)"),
          input()
            .attr("name", "name")
            .attr("value", user?.name ?? "")
            .className("w-full p-2 rounded bg-gray-700 text-white")
            .remote() // Fjernkontroll aktivert
            .listen((event) => {
              console.log("Input activity:", event);
            }),
          p().text("Email"),
          input()
            .attr("name", "email")
            .attr("value", user?.email ?? "")
            .className("w-full p-2 rounded bg-gray-700 text-white"),
          button()
            .attr("type", "submit")
            .className("bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white")
            .text("Save"),
        ])
          .change((e) => {
            const t = e.target;
            console.log("change:", t?.name, t?.value);
          })
          .submit((e) => {
            const data = Object.fromEntries(new FormData(e.target));
            console.log("submit:", data);
          }),
      ])
        .listen((event) => {
          console.log("Div changed:", event.type);
        }),
  ])
);

Deno.serve(async () => render(App()));