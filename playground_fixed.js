import { div, h1, h2, p, table, thead, tbody, tr, th, td, form, input, button, render, factory } from "https://raw.githubusercontent.com/dingemoe/app_leinad/6fff7712d5f64b21ec715c1110f5ffa5ae70388f/classes/html.js";
import { setDefaultTheme } from "https://raw.githubusercontent.com/dingemoe/app_leinad/6fff7712d5f64b21ec715c1110f5ffa5ae70388f/classes/theme.js";

setDefaultTheme("dracula");

// Factory functions for React compatibility
const DevOpsChatDemo = factory(() => 
  div().dracula().className("p-4").set([
    h2().text("🚀 DevOps Chat Simulation"),
    p().text("DevOps kommandoer (simulert):"),
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
    
    // Chat interface
    div().className("bg-gray-900 p-4 rounded-lg").set([
      div().className("bg-gray-800 p-3 rounded mb-4 h-40 overflow-y-auto").set([
        p().className("text-green-400 text-sm").text("System: DevOps chat initialized 🚀"),
        p().className("text-blue-400 text-sm").text("User: /get users /api/users"),
        p().className("text-green-400 text-sm").text("Bot: ✅ Created GET endpoint: /api/users"),
        p().className("text-blue-400 text-sm").text("User: /list-endpoints"),
        p().className("text-green-400 text-sm").text("Bot: 📋 Found 1 endpoint: GET /api/users"),
      ]),
      div().className("flex gap-2").set([
        input()
          .className("flex-1 p-2 rounded bg-gray-700 text-white")
          .attr("placeholder", "Type DevOps command... (e.g., /get users /api/users)")
          .attr("id", "devopsInput"),
        button()
          .className("bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white")
          .text("Execute")
          .click(() => {
            const input = document.getElementById('devopsInput');
            const command = input.value;
            if (command.trim()) {
              console.log('🚀 DevOps Command:', command);
              if (command.startsWith('/')) {
                console.log('✅ Valid DevOps command detected');
              }
              input.value = '';
            }
          })
      ])
    ])
  ])
);

const GitHubDemo = factory(() =>
  div().dracula().className("p-4").set([
    h2().text("🐙 GitHub Integration Demo"),
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

const APIDemo = factory(() =>
  div().dracula().className("p-4 rounded-lg").set([
    h2().text("🌐 API Endpoints Demo"),
    div().className("bg-gray-800 p-3 rounded mb-4 text-sm").set([
      p().className("text-yellow-400").text("Simulated KV API endpoints:"),
      p().text("✓ GET /api/users - List users"),
      p().text("✓ POST /api/users - Create user"),
      p().text("✓ GET /api/data/{key} - Get data"),
      p().text("✓ POST /api/auth/tokens - Generate token"),
    ]),
    div().className("grid grid-cols-2 md:grid-cols-4 gap-2").set([
      button()
        .className("bg-green-600 hover:bg-green-700 p-2 rounded text-white text-sm")
        .text("GET Users")
        .click(() => {
          console.log('🌐 API: GET /api/users');
          fetch('https://jsonplaceholder.typicode.com/users')
            .then(r => r.json())
            .then(users => console.log('👥 Users:', users.slice(0, 2)));
        }),
      button()
        .className("bg-blue-600 hover:bg-blue-700 p-2 rounded text-white text-sm")
        .text("POST User")
        .click(() => {
          console.log('🌐 API: POST /api/users');
          console.log('✅ User created:', { id: Date.now(), name: 'Daniel' });
        }),
      button()
        .className("bg-purple-600 hover:bg-purple-700 p-2 rounded text-white text-sm")
        .text("Get Data")
        .click(() => {
          console.log('🌐 API: GET /api/data/config');
          console.log('💾 Data:', { theme: 'dracula', version: '1.3.16' });
        }),
      button()
        .className("bg-orange-600 hover:bg-orange-700 p-2 rounded text-white text-sm")
        .text("Gen Token")
        .click(() => {
          console.log('🌐 API: POST /api/auth/tokens');
          console.log('🔐 Token:', 'deno-' + Math.random().toString(36).substr(2, 9));
        })
    ])
  ])
);

const App = factory(() =>
  div().dracula().className("min-h-screen p-8").set([
    h1().text("🎉 App Leinad - Deno Playground Demo!"),
    p().className("text-gray-400 mb-8").text("DevOps Chat & KV API Management - Åpne konsoll (F12) for å se action! 📝"),
    
    // DevOps Chat Demo
    DevOpsChatDemo(),
    
    // Separator
    div().className("border-t border-gray-600 my-6"),
    
    // GitHub Demo
    GitHubDemo(),
    
    // Separator  
    div().className("border-t border-gray-600 my-6"),
    
    // API Demo
    APIDemo(),
    
    // Separator
    div().className("border-t border-gray-600 my-6"),
    
    // Users Table (med fetch)
    h2().text("👤 Live Users fra JSONPlaceholder"),
    table().className("w-full bg-gray-800 rounded").set([
      thead().set([
        tr().set([ 
          th().className("text-left p-3 border-b border-gray-600").text("Name"), 
          th().className("text-left p-3 border-b border-gray-600").text("Email"),
          th().className("text-left p-3 border-b border-gray-600").text("Company")
        ]),
      ]),
      tbody("https://jsonplaceholder.typicode.com/users", (u) =>
        tr().className("hover:bg-gray-700").set([ 
          td().className("p-3 border-b border-gray-700").text(u.name ?? ""), 
          td().className("p-3 border-b border-gray-700").text(u.email ?? ""),
          td().className("p-3 border-b border-gray-700").text(u.company?.name ?? "")
        ])
      ),
    ]),
    
    // Interactive Form
    h2().text("🎮 Interactive Form (.listen() & .remote())"),
    div().dracula().className("p-4 rounded-xl mt-4 bg-gray-800").set([
      form("https://jsonplaceholder.typicode.com/users/1", (user) => [
        div().className("grid grid-cols-1 md:grid-cols-2 gap-4").set([
          div().set([
            p().className("mb-2 text-sm font-bold").text("Name (with .listen() & .remote())"),
            input()
              .attr("name", "name")
              .attr("value", user?.name ?? "")
              .className("w-full p-3 rounded bg-gray-700 text-white border border-gray-600")
              .remote() // Fjernkontroll aktivert
              .listen((event) => {
                console.log("👂 Input activity:", event.type, "=>", event.target?.value);
              })
          ]),
          div().set([
            p().className("mb-2 text-sm font-bold").text("Email"),
            input()
              .attr("name", "email")
              .attr("value", user?.email ?? "")
              .className("w-full p-3 rounded bg-gray-700 text-white border border-gray-600")
          ])
        ]),
        div().className("mt-4").set([
          button()
            .attr("type", "submit")
            .className("bg-green-600 hover:bg-green-700 px-6 py-3 rounded text-white font-bold")
            .text("💾 Save Changes")
        ])
      ])
        .change((e) => {
          const t = e.target;
          console.log("📝 Form change:", t?.name, "=", t?.value);
        })
        .submit((e) => {
          e.preventDefault();
          const data = Object.fromEntries(new FormData(e.target));
          console.log("🚀 Form submit:", data);
          alert('Form submitted! Check console for data 📊');
        }),
    ])
      .listen((event) => {
        console.log("🎯 Container event:", event.type);
      }),

    // Footer
    div().className("mt-12 p-6 bg-gray-800 rounded text-center").set([
      p().className("text-gray-400").text("🎮 Open Developer Console (F12) to see all the DevOps magic!"),
      p().className("text-sm text-gray-500 mt-2").text("Framework: App Leinad v1.3.16 | Runtime: Deno | Theme: Dracula 🧛‍♂️"),
      p().className("text-xs text-gray-600 mt-2").text("Features: KV API • DevOps Chat • GitHub Integration • Remote Control • Live Data")
    ])
  ])
);

// Deno playground server
Deno.serve(async () => render(App()));