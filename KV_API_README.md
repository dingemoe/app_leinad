# KV API Server - Dynamic Endpoint Management

Et komplett system for å opprette og administrere API endpoints dynamisk via DevOps chat og Deno KV.

## Rask Start

### 1. Start KV API Server
```bash
deno run --allow-net --allow-read --allow-write deno_kv_api_server.js
```

Server kjører på `http://localhost:3000/` med KV database.

### 2. Start DevOps Chat Interface  
```bash
deno run --allow-net kv_devops_example.js
```

### 3. Opprett Endpoints via Chat

I DevOps chatten, bruk slash commands:

```bash
# Quick endpoint creation
/get users /api/users                    # Create GET endpoint
/post orders /api/orders                 # Create POST endpoint

# Advanced endpoint creation  
/create-endpoint weather /api/weather/{city} GET

# List all endpoints
/list-endpoints

# Data storage
/set-data config {"theme":"dark","lang":"no"}
/get-data config

# Authentication
/generate-token frontend-app
```

## API Endpoints

### System Endpoints (Always Available)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/endpoints` | List all registered endpoints |
| `POST` | `/api/endpoints` | Create new custom endpoint |
| `DELETE` | `/api/endpoints/{id}` | Delete custom endpoint |
| `GET` | `/api/data/{key}` | Get stored data by key |
| `POST` | `/api/data/{key}` | Store data by key |
| `POST` | `/api/auth/tokens` | Generate API token |

### Custom Endpoints (Created Dynamically)

Endpoints du oppretter via chat blir automatisk tilgjengelige.

## DevOps Chat Commands

### Endpoint Management
```bash
/list-endpoints                          # List all endpoints
/create-endpoint name path method        # Create custom endpoint
/delete-endpoint {id}                    # Delete endpoint
/get {name} {path}                      # Quick create GET endpoint  
/post {name} {path}                     # Quick create POST endpoint
```

### Data Storage
```bash
/get-data {key}                         # Retrieve data
/set-data {key} {json_data}             # Store data
```

### Authentication
```bash
/generate-token {name}                  # Create API token
```

## Eksempler

### 1. Opprett en User API
```bash
# I DevOps chat:
/get users /api/users
/post user-create /api/users  
/get user-detail /api/users/{id}

# Test med curl:
curl http://localhost:3000/api/users
curl -X POST http://localhost:3000/api/users
curl http://localhost:3000/api/users/123
```

### 2. Lagre konfigurasjon
```bash
# Store config
/set-data app-config {"theme":"dark","language":"no","features":["chat","api"]}

# Retrieve config  
/get-data app-config

# Test med curl:
curl http://localhost:3000/api/data/app-config
```

### 3. API med autentisering
```bash
# Generate token
/generate-token my-secure-app

# Create protected endpoint
/create-endpoint secure /api/secure GET --auth=true

# Test with token:
curl -H "Authorization: Bearer your-token" http://localhost:3000/api/secure
```

### 4. Weather API eksempel
```bash
# Create weather endpoint
/create-endpoint weather /api/weather/{city} GET

# Test different cities:
curl http://localhost:3000/api/weather/oslo
curl http://localhost:3000/api/weather/bergen
```

## Advanced Usage

### Custom Response Data
```bash
/create-endpoint products /api/products GET \\
  --response_data='{"products":[{"id":1,"name":"Widget"}]}' \\
  --response_code=200
```

### Endpoint Templates
```javascript
// I kode:
import { setupExampleEndpoints } from "./classes/kv_devops.js";

// Setup predefined endpoints
await setupExampleEndpoints('http://localhost:3000');
```

## Filer

- `deno_kv_api_server.js` - Hovedserver med KV database
- `classes/kv_devops.js` - DevOps integrasjon for KV management  
- `kv_devops_example.js` - Komplett chat interface
- `KV_API_README.md` - Denne dokumentasjonen

## Bruk Cases

### 1. Prototype API
Raskt opprette API endpoints for frontend utvikling uten backend kode.

### 2. Mock Services  
Opprette mock endpoints for testing og utvikling.

### 3. Configuration Storage
Sentral lagring av app konfigurasjon via KV.

### 4. DevOps Automation
Administrere API endpoints via chat commands i team.

### 5. Dynamic Microservices
Opprette og fjerne API endpoints basert på behov.

## KV Database Structure

```
endpoints/
  ├── custom_1234567890_abc123 → endpoint_config
  ├── custom_1234567891_def456 → endpoint_config
  └── ...

data/
  ├── app-config → configuration_data
  ├── user-settings → user_data  
  └── ...

auth_tokens/
  ├── uuid-token-1 → token_info
  ├── uuid-token-2 → token_info
  └── ...
```

## Tips

1. **Organisering**: Bruk beskrivende navn på endpoints for lettere administrasjon
2. **Testing**: Test endpoints med curl eller Postman etter opprettelse  
3. **Sikkerhet**: Bruk authentication for sensitive endpoints
4. **Backup**: KV data lagres lokalt, sikkerhetskopier ved behov
5. **Monitoring**: Bruk `/api/endpoints` for å se alle aktive endpoints

Nå har du et komplett "API-as-a-Service" system som kan administreres via DevOps chat! 🚀