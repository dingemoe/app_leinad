# app_leinad

Et modulært React-basert UI framework med tema støtte, asyncrone komponenter og real-time chat.

## Funksjoner

### Core HTML Komponenter (`classes/html.js`)
- **El klasse**: Base klasse for alle HTML elementer
- **Factory funksjoner**: `div()`, `span()`, `input()`, etc.
- **Fluent API**: `.className()`, `.attr()`, `.text()`, `.set()`
- **Tema støtte**: `.light()`, `.dark()`, `.dracula()`
- **Async komponenter**: `tbody()`, `form()` med fetch support
- **Observere**: `.listen()` for element endringer
- **Fjernkontroll**: `.remote()` for WebSocket input kontroll
- **Server rendering**: `render()` funksjon for Deno.serve

### Real-time Chat System (`classes/channel.js`)
- **Multi-user chat**: Støtter brukere og AI agenter
- **Real-time messaging**: WebSocket og HTTP polling
- **Auto-scroll**: Automatisk scrolling til nye meldinger
- **Typing indicators**: Vis når brukere skriver
- **User presence**: Online/offline status
- **Message history**: Konfigurerbar melding historikk
- **Emoji support**: Integrert emoji støtte
- **DevOps commands**: Slash commands for API integrasjon

### DevOps Integration (`classes/devops.js`)
- **Slash commands**: `/command params --flags` støtte
- **API integrasjon**: REST API calls via chat
- **Multiple endpoints**: Konfigurerbare API endpoints
- **Parameter parsing**: Path, query og body parametere
- **Response formatting**: Formatert API responses med syntax highlighting
- **Error handling**: Robust feilhåndtering
- **Presets**: Ferdigkonfigurerte integrasjoner (K8s, Docker, GitHub, etc.)

## Rask Start

### Enkel Deno App
```javascript
import { div, h1, render } from "https://raw.githubusercontent.com/dingemoe/app_leinad/main/classes/html.js";
import { setDefaultTheme } from "https://raw.githubusercontent.com/dingemoe/app_leinad/main/classes/theme.js";

setDefaultTheme("light");

class App {
  render() {
    return div().set([
      h1().text("Hei Verden!")
    ]);
  }
}

Deno.serve(async () => render(new App()));
```

### Chat Applikasjon
```javascript
import { div, render } from "https://raw.githubusercontent.com/dingemoe/app_leinad/main/classes/html.js";
import { channel } from "https://raw.githubusercontent.com/dingemoe/app_leinad/main/classes/channel.js";

class ChatApp {
  render() {
    const chat = channel("general", {
      wsUrl: "ws://localhost:8080/chat",
      autoScroll: true
    });
    
    chat.addUser("user1", { name: "Alice" });
    chat.addAgent("bot1", { name: "Assistant", type: "ai" });
    
    return div().set([chat]);
  }
}

Deno.serve(async () => render(new ChatApp()));
```

## API Dokumentasjon

### HTML Element Metoder
- `.set(children)` - Legg til child elementer (erstatter `.content()`)
- `.listen(callback)` - Observere element endringer
- `.remote(wsUrl?)` - Aktiver fjernkontroll via WebSocket
- `.theme(name)` - Sett tema
- `.className(cls)` - Sett CSS klasser
- `.attr(name, value)` - Sett attributter
- `.text(content)` - Legg til tekst

### Channel Metoder
- `channel(id, options)` - Opprett ny chat kanal
- `.addUser(id, data)` - Legg til bruker
- `.addAgent(id, data)` - Legg til AI agent
- `.sendSystemMessage(text)` - Send system melding
- `.setCurrentUser(id, name)` - Sett nåværende bruker

### Channel Options
```javascript
{
  maxMessages: 100,        // Maksimalt antall meldinger i historikk
  autoScroll: true,        // Automatisk scroll til nye meldinger
  showUserList: true,      // Vis brukerliste
  showTimestamps: true,    // Vis tidsstempler
  allowEmoji: true,        // Tillat emoji
  wsUrl: "ws://...",       // WebSocket URL
  httpEndpoint: "http://..." // HTTP polling endpoint
}
```

## WebSocket Server

Start den inkluderte WebSocket serveren for chat testing:

```bash
deno run --allow-net websocket_server.js
```

Server kjører på `ws://localhost:8080/` og støtter:
- **Kanaler**: general, support, ai-assistant, etc.
- **Meldingstyper**: join, message, typing
- **Auto-reconnect**: Automatisk gjenoppkobling

## Tema System

Supported temaer:
- `light` - Standard lyst tema
- `dark` - Mørkt tema  
- `dracula` - Dracula fargepalett

```javascript
import { setDefaultTheme } from "./classes/theme.js";
setDefaultTheme("dracula");

// Eller per element
div().dracula().set([...])
```

## Filer

- `classes/html.js` - Core HTML komponenter og rendering
- `classes/channel.js` - Real-time chat system
- `classes/theme.js` - Tema håndtering
- `websocket_server.js` - WebSocket chat server
- `chat_example.js` - Komplett chat app eksempel