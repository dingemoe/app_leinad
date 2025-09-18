import { div, h1, h2, p, table, thead, tbody, tr, th, td, form, input, button, render, factory } from "https://raw.githubusercontent.com/dingemoe/app_leinad/6fff7712d5f64b21ec715c1110f5ffa5ae70388f/classes/html.js";
import { setDefaultTheme } from "https://raw.githubusercontent.com/dingemoe/app_leinad/6fff7712d5f64b21ec715c1110f5ffa5ae70388f/classes/theme.js";

setDefaultTheme("dracula");

// Åpne KV database
const kv = await Deno.openKv();

// KV helper functions
const kvHelpers = {
  async setUser(id, userData) {
    await kv.set(["user", id], userData);
    console.log(`✅ User ${id} saved:`, userData);
  },
  
  async getUser(id) {
    const res = await kv.get(["user", id]);
    console.log(`📋 User ${id}:`, res.value);
    return res.value;
  },
  
  async getAllUsers() {
    const users = [];
    for await (const entry of kv.list({ prefix: ["user"] })) {
      users.push({ key: entry.key, value: entry.value });
    }
    console.log(`👥 Found ${users.length} users:`, users);
    return users;
  },
  
  async incrementCounter(name) {
    const key = ["counter", name];
    const res = await kv.get(key);
    const current = res.value ?? 0;
    const newValue = current + 1;
    await kv.set(key, newValue);
    console.log(`🔢 Counter ${name}: ${current} → ${newValue}`);
    return newValue;
  },
  
  async setConfig(key, config) {
    await kv.set(["config", key], config);
    console.log(`⚙️ Config ${key} saved:`, config);
  },
  
  async getConfig(key) {
    const res = await kv.get(["config", key]);
    console.log(`⚙️ Config ${key}:`, res.value);
    return res.value;
  }
};

// Real KV Demo Component
const KVDemo = factory(() =>
  div().dracula().className("p-4").set([
    h2().text("💾 Deno KV Database Demo"),
    p().text("Ekte KV operasjoner - sjekk konsollen!"),
    
    div().className("grid grid-cols-2 md:grid-cols-4 gap-3 mb-6").set([
      button()
        .className("bg-green-600 hover:bg-green-700 p-3 rounded text-white text-sm")
        .text("💾 Save User")
        .click(async () => {
          const userData = {
            name: "Daniel",
            role: "utvikler",
            timestamp: new Date().toISOString()
          };
          await kvHelpers.setUser("123", userData);
        }),
        
      button()
        .className("bg-blue-600 hover:bg-blue-700 p-3 rounded text-white text-sm")
        .text("📋 Get User")
        .click(async () => {
          await kvHelpers.getUser("123");
        }),
        
      button()
        .className("bg-purple-600 hover:bg-purple-700 p-3 rounded text-white text-sm")
        .text("👥 List Users")
        .click(async () => {
          await kvHelpers.getAllUsers();
        }),
        
      button()
        .className("bg-orange-600 hover:bg-orange-700 p-3 rounded text-white text-sm")
        .text("🔢 Counter++")
        .click(async () => {
          await kvHelpers.incrementCounter("clicks");
        })
    ]),
    
    div().className("grid grid-cols-1 md:grid-cols-2 gap-4").set([
      div().className("bg-gray-800 p-4 rounded").set([
        h3().className("text-lg mb-3").text("⚙️ Configuration Storage"),
        div().className("space-y-2").set([
          button()
            .className("w-full bg-gray-700 hover:bg-gray-600 p-2 rounded text-white text-sm")
            .text("Save App Config")
            .click(async () => {
              await kvHelpers.setConfig("app", {
                theme: "dracula",
                version: "1.3.16",
                features: ["kv", "chat", "devops"]
              });
            }),
          button()
            .className("w-full bg-gray-700 hover:bg-gray-600 p-2 rounded text-white text-sm")
            .text("Load App Config")
            .click(async () => {
              await kvHelpers.getConfig("app");
            })
        ])
      ]),
      
      div().className("bg-gray-800 p-4 rounded").set([
        h3().className("text-lg mb-3").text("🎯 Advanced Operations"),
        div().className("space-y-2").set([
          button()
            .className("w-full bg-red-700 hover:bg-red-600 p-2 rounded text-white text-sm")
            .text("Add Random User")
            .click(async () => {
              const randomId = Math.random().toString(36).substr(2, 9);
              await kvHelpers.setUser(randomId, {
                name: `User_${randomId}`,
                role: "guest",
                created: Date.now()
              });
            }),
          button()
            .className("w-full bg-yellow-700 hover:bg-yellow-600 p-2 rounded text-white text-sm")
            .text("Increment Page Views")
            .click(async () => {
              await kvHelpers.incrementCounter("pageviews");
            })
        ])
      ])
    ])
  ])
);

// Interactive KV Form
const KVForm = factory(() =>
  div().dracula().className("p-4").set([
    h2().text("📝 Interactive KV Form"),
    div().className("bg-gray-800 p-4 rounded").set([
      div().className("grid grid-cols-1 md:grid-cols-2 gap-4 mb-4").set([
        div().set([
          p().className("mb-2 text-sm font-bold").text("User ID"),
          input()
            .attr("id", "userId")
            .attr("placeholder", "e.g., 456")
            .className("w-full p-2 rounded bg-gray-700 text-white border border-gray-600")
        ]),
        div().set([
          p().className("mb-2 text-sm font-bold").text("User Name"),
          input()
            .attr("id", "userName")
            .attr("placeholder", "e.g., Alice")
            .className("w-full p-2 rounded bg-gray-700 text-white border border-gray-600")
        ])
      ]),
      div().className("grid grid-cols-1 md:grid-cols-3 gap-2").set([
        button()
          .className("bg-green-600 hover:bg-green-700 p-2 rounded text-white")
          .text("💾 Save to KV")
          .click(async () => {
            const userId = document.getElementById('userId').value;
            const userName = document.getElementById('userName').value;
            
            if (userId && userName) {
              await kvHelpers.setUser(userId, {
                name: userName,
                role: "custom",
                created: new Date().toISOString()
              });
            } else {
              alert('Fill in both User ID and Name!');
            }
          }),
        button()
          .className("bg-blue-600 hover:bg-blue-700 p-2 rounded text-white")
          .text("📋 Load from KV")
          .click(async () => {
            const userId = document.getElementById('userId').value;
            if (userId) {
              const user = await kvHelpers.getUser(userId);
              if (user) {
                document.getElementById('userName').value = user.name || '';
              }
            } else {
              alert('Enter User ID first!');
            }
          }),
        button()
          .className("bg-purple-600 hover:bg-purple-700 p-2 rounded text-white")
          .text("🗑️ Clear Form")
          .click(() => {
            document.getElementById('userId').value = '';
            document.getElementById('userName').value = '';
          })
      ])
    ])
  ])
);

// API Simulation with KV backend
const APIWithKV = factory(() =>
  div().dracula().className("p-4").set([
    h2().text("🌐 API + KV Backend Simulation"),
    p().className("text-gray-400 mb-4").text("Simulerer REST API med KV som database"),
    
    div().className("bg-gray-800 p-4 rounded").set([
      div().className("grid grid-cols-2 md:grid-cols-4 gap-2 mb-4").set([
        button()
          .className("bg-green-600 hover:bg-green-700 p-2 rounded text-white text-xs")
          .text("GET /users")
          .click(async () => {
            console.log('🌐 API: GET /users');
            const users = await kvHelpers.getAllUsers();
            console.log('📊 Response:', { count: users.length, users });
          }),
        button()
          .className("bg-blue-600 hover:bg-blue-700 p-2 rounded text-white text-xs")
          .text("POST /users")
          .click(async () => {
            console.log('🌐 API: POST /users');
            const newId = Date.now().toString();
            await kvHelpers.setUser(newId, {
              name: "API User",
              role: "api-created",
              endpoint: "POST /users"
            });
          }),
        button()
          .className("bg-yellow-600 hover:bg-yellow-700 p-2 rounded text-white text-xs")
          .text("GET /config")
          .click(async () => {
            console.log('🌐 API: GET /config');
            const config = await kvHelpers.getConfig("app");
            console.log('📊 Response:', config || { error: "Config not found" });
          }),
        button()
          .className("bg-red-600 hover:bg-red-700 p-2 rounded text-white text-xs")
          .text("GET /stats")
          .click(async () => {
            console.log('🌐 API: GET /stats');
            const users = await kvHelpers.getAllUsers();
            const clicks = await kv.get(["counter", "clicks"]);
            const pageviews = await kv.get(["counter", "pageviews"]);
            
            console.log('📊 Response:', {
              totalUsers: users.length,
              totalClicks: clicks.value || 0,
              totalPageviews: pageviews.value || 0,
              timestamp: new Date().toISOString()
            });
          })
      ]),
      
      p().className("text-xs text-gray-500").text("💡 Alle API calls bruker ekte Deno KV som backend!")
    ])
  ])
);

const App = factory(() =>
  div().dracula().className("min-h-screen p-8").set([
    h1().text("💾 Deno KV Database Demo!"),
    p().className("text-gray-400 mb-8").text("Ekte KV operasjoner med Deno.openKv() - Åpne konsoll (F12) for å se all action! 🚀"),
    
    // KV Demo
    KVDemo(),
    
    // Separator
    div().className("border-t border-gray-600 my-6"),
    
    // Interactive Form
    KVForm(),
    
    // Separator
    div().className("border-t border-gray-600 my-6"),
    
    // API Simulation
    APIWithKV(),
    
    // Separator
    div().className("border-t border-gray-600 my-6"),
    
    // Users Table (live from JSONPlaceholder + KV stats)
    h2().text("📊 Live Data + KV Stats"),
    div().className("grid grid-cols-1 md:grid-cols-2 gap-6").set([
      div().set([
        h3().text("🌐 JSONPlaceholder Users"),
        table().className("w-full bg-gray-800 rounded").set([
          thead().set([
            tr().set([ 
              th().className("text-left p-2 border-b border-gray-600 text-sm").text("Name"), 
              th().className("text-left p-2 border-b border-gray-600 text-sm").text("Email")
            ]),
          ]),
          tbody("https://jsonplaceholder.typicode.com/users", (u) =>
            tr().className("hover:bg-gray-700").set([ 
              td().className("p-2 border-b border-gray-700 text-sm").text(u.name ?? ""), 
              td().className("p-2 border-b border-gray-700 text-sm").text(u.email ?? "")
            ])
          ),
        ])
      ]),
      
      div().set([
        h3().text("💾 KV Database Status"),
        div().className("bg-gray-800 p-4 rounded space-y-2").set([
          button()
            .className("w-full bg-gray-700 hover:bg-gray-600 p-2 rounded text-white text-sm")
            .text("🔍 Show KV Stats")
            .click(async () => {
              const users = await kvHelpers.getAllUsers();
              const clicks = await kv.get(["counter", "clicks"]);
              const pageviews = await kv.get(["counter", "pageviews"]);
              
              console.log('📊 KV Database Stats:', {
                totalUsers: users.length,
                userKeys: users.map(u => u.key),
                counters: {
                  clicks: clicks.value || 0,
                  pageviews: pageviews.value || 0
                }
              });
            }),
          p().className("text-xs text-gray-500").text("💡 Database: .deno/kv (ephemeral i playground)")
        ])
      ])
    ]),

    // Footer
    div().className("mt-12 p-6 bg-gray-800 rounded text-center").set([
      p().className("text-gray-400").text("💾 Ekte Deno KV Database i aksjon!"),
      p().className("text-sm text-gray-500 mt-2").text("Framework: App Leinad v1.3.16 | Database: Deno KV | Theme: Dracula 🧛‍♂️"),
      p().className("text-xs text-gray-600 mt-2").text("Features: openKv() • set/get • atomic counters • list operations • hierarchical keys")
    ])
  ])
);

// Deno playground server with KV
Deno.serve(async () => render(App()));