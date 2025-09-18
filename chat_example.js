// Eksempel på bruk av Channel klassen

import { div, h1, render } from "./classes/html.js";
import { channel } from "./classes/channel.js";
import { setDefaultTheme } from "./classes/theme.js";

setDefaultTheme("light");

class ChatApp {
  render() {
    // Opprett flere kanaler
    const generalChannel = channel("general", {
      wsUrl: "ws://localhost:8080/chat",
      autoScroll: true,
      maxMessages: 50
    });

    const supportChannel = channel("support", {
      httpEndpoint: "http://localhost:3000/api/chat",
      showUserList: true,
      allowEmoji: true
    });

    const aiChannel = channel("ai-assistant", {
      wsUrl: "ws://localhost:8080/ai",
      autoScroll: true
    });

    // Legg til noen brukere og agenter
    generalChannel.addUser("user1", { name: "Alice", status: "online" });
    generalChannel.addUser("user2", { name: "Bob", status: "away" });
    generalChannel.addAgent("bot1", { name: "ChatBot", type: "assistant", status: "active" });

    supportChannel.addAgent("support1", { name: "Support Agent", type: "human", status: "active" });
    
    aiChannel.addAgent("gpt", { name: "GPT Assistant", type: "ai", status: "active" });

    // Send noen eksempel meldinger
    setTimeout(() => {
      generalChannel.sendSystemMessage("Velkommen til #general kanalen!");
      
      // Simuler innkommende meldinger
      setTimeout(() => {
        generalChannel._addMessage({
          id: "sim1",
          type: "message",
          text: "Hei alle sammen! 👋",
          timestamp: Date.now(),
          sender: { id: "user1", name: "Alice", type: "user" }
        });
      }, 1000);

      setTimeout(() => {
        generalChannel._addMessage({
          id: "sim2", 
          type: "message",
          text: "Hei Alice! Hvordan har du det?",
          timestamp: Date.now(),
          sender: { id: "bot1", name: "ChatBot", type: "agent" }
        });
      }, 2000);
    }, 500);

    return div().className("chat-app h-screen bg-gray-50").set([
      h1().className("text-2xl font-bold p-4 bg-white shadow-sm")
        .text("Multi-Channel Chat"),
      
      div().className("flex h-full").set([
        // Sidebar med kanaler
        div().className("w-64 bg-white border-r border-gray-200 p-4").set([
          h1().className("font-semibold mb-4").text("Channels"),
          div().className("space-y-2").set([
            div().className("p-2 rounded bg-blue-100 text-blue-800").text("# general"),
            div().className("p-2 rounded hover:bg-gray-100").text("# support"),
            div().className("p-2 rounded hover:bg-gray-100").text("# ai-assistant")
          ])
        ]),
        
        // Hovedchat område
        div().className("flex-1 flex").set([
          // Aktiv kanal (general)
          div().className("flex-1").set([generalChannel]),
          
          // Sidebar med brukerliste (hvis ønsket)
          div().className("w-48 bg-gray-50 border-l border-gray-200 p-4").set([
            h1().className("font-semibold mb-4").text("Online"),
            div().className("space-y-2").set([
              div().className("flex items-center space-x-2").set([
                div().className("w-2 h-2 bg-green-500 rounded-full"),
                span().text("Alice")
              ]),
              div().className("flex items-center space-x-2").set([
                div().className("w-2 h-2 bg-yellow-500 rounded-full"),
                span().text("Bob")
              ]),
              div().className("flex items-center space-x-2").set([
                div().className("w-2 h-2 bg-purple-500 rounded-full"),
                span().text("ChatBot 🤖")
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
  Deno.serve(async () => render(new ChatApp(), {
    title: "Multi-Channel Chat App",
    scripts: [
      "https://cdn.tailwindcss.com"
    ]
  }));
}

// For Node.js eller andre miljøer
export default ChatApp;