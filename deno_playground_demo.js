import { div, h1, h2, p, table, thead, tbody, tr, th, td, form, input, button, render } from "https://raw.githubusercontent.com/dingemoe/app_leinad/6fff7712d5f64b21ec715c1110f5ffa5ae70388f/classes/html.js";
import { setDefaultTheme } from "https://raw.githubusercontent.com/dingemoe/app_leinad/6fff7712d5f64b21ec715c1110f5ffa5ae70388f/classes/theme.js";

setDefaultTheme("dracula");

class SimpleChat {
  render() {
    return div().dracula().className("p-4 rounded-lg").set([
      h2().text("💬 Chat Demo"),
      div().className("bg-gray-800 p-3 rounded mb-4 h-32 overflow-y-auto").set([
        p().className("text-green-400").text("System: Chat initialized"),
        p().className("text-blue-400").text("User: Hello world!"),
        p().className("text-purple-400").text("Assistant: Hi there! 👋"),
      ]),
      div().className("flex gap-2").set([
        input()
          .className("flex-1 p-2 rounded bg-gray-700 text-white")
          .attr("placeholder", "Type a message...")
          .attr("id", "chatInput"),
        button()
          .className("bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white")
          .text("Send")
          .click(() => {
            const input = document.getElementById('chatInput');
            const message = input.value;
            if (message.trim()) {
              console.log('New message:', message);
              input.value = '';
            }
          })
      ])
    ]);
  }
}

class APIDemo {
  render() {
    return div().dracula().className("p-4 rounded-lg").set([
      h2().text("🚀 API Endpoints Demo"),
      div().className("bg-gray-800 p-3 rounded mb-4 text-sm").set([
        p().className("text-yellow-400").text("Available endpoints:"),
        p().text("GET /api/users - List users"),
        p().text("POST /api/users - Create user"),
        p().text("GET /api/health - Health check"),
      ]),
      div().className("grid grid-cols-1 md:grid-cols-3 gap-4").set([
        button()
          .className("bg-green-600 hover:bg-green-700 p-3 rounded text-white")
          .text("GET Users")
          .click(() => {
            console.log('Fetching users...');
            fetch('https://jsonplaceholder.typicode.com/users')
              .then(r => r.json())
              .then(users => console.log('Users:', users.slice(0, 3)));
          }),
        button()
          .className("bg-blue-600 hover:bg-blue-700 p-3 rounded text-white")
          .text("POST User")
          .click(() => {
            console.log('Creating user...');
            fetch('https://jsonplaceholder.typicode.com/users', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: 'Daniel', email: 'daniel@example.com' })
            })
              .then(r => r.json())
              .then(user => console.log('Created user:', user));
          }),
        button()
          .className("bg-purple-600 hover:bg-purple-700 p-3 rounded text-white")
          .text("Health Check")
          .click(() => {
            console.log('Health: OK ✅');
            console.log('Timestamp:', new Date().toISOString());
          })
      ])
    ]);
  }
}

class App {
  render() {
    return div().dracula().className("min-h-screen p-8").set([
      h1().text("🎉 Deno Playground Demo!"),
      p().className("text-gray-400 mb-8").text("Klikk på knappene og sjekk konsollen for output 📝"),
      
      // Chat Demo
      new SimpleChat(),
      
      // Separator
      div().className("border-t border-gray-600 my-8"),
      
      // API Demo
      new APIDemo(),
      
      // Separator
      div().className("border-t border-gray-600 my-8"),
      
      // Users Table (med fetch)
      h2().text("👤 Users fra JSONPlaceholder"),
      table().className("w-full bg-gray-800 rounded").set([
        thead().set([
          tr().set([ 
            th().className("text-left p-3 border-b border-gray-600").text("Name"), 
            th().className("text-left p-3 border-b border-gray-600").text("Email"),
            th().className("text-left p-3 border-b border-gray-600").text("Website")
          ]),
        ]),
        tbody("https://jsonplaceholder.typicode.com/users", (u) =>
          tr().className("hover:bg-gray-700").set([ 
            td().className("p-3 border-b border-gray-700").text(u.name ?? ""), 
            td().className("p-3 border-b border-gray-700").text(u.email ?? ""),
            td().className("p-3 border-b border-gray-700").text(u.website ?? "")
          ])
        ),
      ]),
      
      // Interactive Form
      h2().text("🎮 Interactive Form"),
      div().dracula().className("p-4 rounded-xl mt-4 bg-gray-800").set([
        form("https://jsonplaceholder.typicode.com/users/1", (user) => [
          div().className("mb-4").set([
            p().className("mb-2").text("Name (with .listen() and .remote())"),
            input()
              .attr("name", "name")
              .attr("value", user?.name ?? "")
              .className("w-full p-3 rounded bg-gray-700 text-white border border-gray-600")
              .remote() // Fjernkontroll aktivert
              .listen((event) => {
                console.log("👂 Input activity:", event.type, event.target?.value);
              })
          ]),
          div().className("mb-4").set([
            p().className("mb-2").text("Email"),
            input()
              .attr("name", "email")
              .attr("value", user?.email ?? "")
              .className("w-full p-3 rounded bg-gray-700 text-white border border-gray-600")
          ]),
          div().className("mb-4").set([
            p().className("mb-2").text("Website"),
            input()
              .attr("name", "website")
              .attr("value", user?.website ?? "")
              .className("w-full p-3 rounded bg-gray-700 text-white border border-gray-600")
          ]),
          button()
            .attr("type", "submit")
            .className("bg-green-600 hover:bg-green-700 px-6 py-3 rounded text-white font-bold")
            .text("💾 Save Changes"),
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
      div().className("mt-12 p-4 bg-gray-800 rounded text-center").set([
        p().className("text-gray-400").text("🎮 Open Developer Console (F12) to see all the action!"),
        p().className("text-sm text-gray-500 mt-2").text("Framework: App Leinad v1.3.16 | Runtime: Deno")
      ])
    ]);
  }
}

// Deno playground server
Deno.serve(async () => render(new App()));