# App Leinad Framework 🚀

Et modulært React-basert UI framework med tema støtte, asyncrone komponenter, real-time chat og KV-basert API management.

## 🎯 Hovedfunksjoner

### 🚀 KV API System (Nytt!)
Komplett system for dynamisk API management via DevOps chat:
- **Dynamic endpoints**: Opprett API endpoints via chat commands
- **KV storage**: Persistent data lagring med Deno KV
- **DevOps chat**: Administrer API via slash commands
- **Authentication**: Token-basert API sikkerhet
- **Real-time**: Live endpoint creation og management

```bash
# Start KV API server
deno run --allow-net --allow-read --allow-write deno_kv_api_server.js

# Start DevOps chat interface
deno run --allow-net kv_devops_example.js

# Create endpoints via chat
/get users /api/users
/post orders /api/orders  
/set-data config {"theme":"dark"}
```

📖 **Se [KV_API_README.md](./KV_API_README.md) for fullstendig dokumentasjon.**

## 🔧 Core Komponenter

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

### DevOps Chat Applikasjon
```javascript
import { div, render } from "./classes/html.js";
import { channel } from "./classes/channel.js";
import { devops } from "./classes/devops.js";

class DevOpsChat {
  render() {
    const integration = devops({
      baseUrl: 'https://api.github.com',
      endpoints: [
        {
          name: 'repos',
          path: '/user/repos',
          method: 'GET',
          description: 'List repositories',
          aliases: ['r']
        },
        {
          name: 'issues',
          path: '/repos/{owner}/{repo}/issues',
          method: 'GET',
          description: 'List issues',
          params: [
            { name: 'owner', type: 'path', required: true },
            { name: 'repo', type: 'path', required: true }
          ]
        }
      ]
    });
    
    const chat = channel("devops", {
      devops: integration,
      autoScroll: true
    });
    
    return div().set([chat]);
  }
}

Deno.serve(async () => render(new DevOpsChat()));
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
  httpEndpoint: "http://...", // HTTP polling endpoint
  devops: devopsInstance   // DevOps integrasjon
}
```

### DevOps Commands

Bruk slash commands i chatten for å kalle API endpoints:

```bash
# Basis kommandoer
/help                    # Vis tilgjengelige kommandoer
/status                  # Sjekk API status
/config                  # Vis konfigurasjon

# GitHub API eksempler
/repos                   # List repositories
/repos --per_page=5      # List 5 repositories
/repo microsoft vscode   # Get repository details
/issues microsoft vscode # List issues
/pr microsoft vscode     # List pull requests

# Kubernetes eksempler
/pods                    # List pods
/pods --namespace=kube-system # List pods in namespace
/deploy myapp            # Create deployment
/scale myapp 5           # Scale to 5 replicas

# Docker eksempler
/containers              # List containers
/start container_id      # Start container
/logs container_id       # Get container logs
```

### DevOps Configuration
```javascript
const devopsIntegration = devops({
  baseUrl: 'https://api.example.com',
  timeout: 30000,
  headers: { 'Authorization': 'Bearer token' },
  endpoints: [
    {
      name: 'deploy',              // Command name
      path: '/deploy/{app}',       // API path
      method: 'POST',              // HTTP method
      description: 'Deploy app',   // Help text
      params: [
        { name: 'app', type: 'path', required: true },
        { name: 'version', type: 'body', default: 'latest' },
        { name: 'env', type: 'query', default: 'prod' }
      ],
      aliases: ['d']               // Alternative names
    }
  ]
});
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
- `classes/channel.js` - Real-time chat system med DevOps støtte
- `classes/devops.js` - DevOps API integrasjon med slash commands
- `classes/theme.js` - Tema håndtering
- `websocket_server.js` - WebSocket chat server
- `chat_example.js` - Basic chat app eksempel
- `devops_chat_example.js` - DevOps chat med slash commands
- `devops_configs.js` - Ferdigkonfigurerte DevOps integrasjoner