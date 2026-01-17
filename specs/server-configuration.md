# Server Configuration Specification

**Status:** Planned
**Version:** 1.0
**Last Updated:** 2025-01-17

---

## 1. Overview

### Purpose

Server configuration defines how the MCP server is initialized, how it authenticates with Papla Media's API, how output files are handled, and how it communicates with MCP clients. This is the foundation that all tools depend on.

### Goals

- **Simple setup** - Single environment variable for API key
- **Sensible defaults** - Works out of the box with reasonable defaults
- **Stdio transport** - Compatible with Claude Desktop and other MCP clients
- **Clear errors** - Helpful error messages for configuration issues
- **Bun runtime** - Fast startup, native TypeScript execution, no build step

### Non-Goals

- **HTTP transport** - Only stdio transport for initial version
- **Multiple API keys** - Single API key per server instance
- **Dynamic reconfiguration** - Config is read at startup only

---

## 2. Architecture

### Component Structure

```
src/
├── index.ts              # Entry point, server initialization
├── config.ts             # Configuration loading and validation
├── server.ts             # MCP server setup and tool registration
├── api/
│   └── papla-client.ts   # Papla API HTTP client
├── tools/
│   └── *.ts              # Individual tool implementations
└── utils/
    ├── file-output.ts    # Output path resolution
    └── errors.ts         # Error types and handling
```

### Startup Flow

```
┌─────────────────┐
│  Load Config    │
│  (env vars)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│  Validate       │────▶│  Exit with      │
│  Config         │ err │  helpful error  │
└────────┬────────┘     └─────────────────┘
         │ ok
         ▼
┌─────────────────┐
│  Create Papla   │
│  API Client     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Create MCP     │
│  Server         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Register       │
│  All Tools      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Connect Stdio  │
│  Transport      │
└─────────────────┘
```

---

## 3. Core Types

### 3.1 ServerConfig

Configuration for the MCP server.

```typescript
interface ServerConfig {
  apiKey: string;
  outputDir: string;
  apiBaseUrl: string;
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `apiKey` | string | Yes | Papla API key for authentication |
| `outputDir` | string | No | Directory for auto-generated output files |
| `apiBaseUrl` | string | No | Base URL for Papla API (for testing) |

### 3.2 PaplaClient

HTTP client for Papla API calls.

```typescript
class PaplaClient {
  constructor(config: { apiKey: string; baseUrl: string });

  // TTS
  textToSpeech(voiceId: string, text: string): Promise<ArrayBuffer>;

  // Voices
  listVoices(): Promise<Voice[]>;
  getVoice(voiceId: string): Promise<Voice>;
  addVoice(name: string, audioData: ArrayBuffer, description?: string): Promise<Voice>;
  editVoice(voiceId: string, updates: Partial<Voice>): Promise<Voice>;
  deleteVoice(voiceId: string): Promise<void>;

  // History
  listHistory(): Promise<HistoryItem[]>;
  getHistory(historyItemId: string): Promise<HistoryItem>;
  getHistoryAudio(historyItemId: string): Promise<ArrayBuffer>;
  deleteHistory(historyItemId: string): Promise<void>;
}
```

---

## 4. Configuration

### Environment Variables

| Variable | Type | Description | Default |
|----------|------|-------------|---------|
| `PAPLA_API_KEY` | string | **Required.** API key from papla.media account | (none) |
| `PAPLA_OUTPUT_DIR` | string | Directory for generated audio files | `~/papla-audio` |
| `PAPLA_API_BASE_URL` | string | Base URL for API (testing only) | `https://papla.media` |

### Configuration Loading

```typescript
function loadConfig(): ServerConfig {
  const apiKey = process.env.PAPLA_API_KEY;
  if (!apiKey) {
    console.error('Error: PAPLA_API_KEY environment variable is required');
    console.error('Get your API key at: https://app.papla.media');
    process.exit(1);
  }

  const outputDir = process.env.PAPLA_OUTPUT_DIR ||
    path.join(os.homedir(), 'papla-audio');

  const apiBaseUrl = process.env.PAPLA_API_BASE_URL ||
    'https://papla.media';

  return { apiKey, outputDir, apiBaseUrl };
}
```

---

## 5. API / Behaviors

### 5.1 Server Initialization

**Entry Point:** `src/index.ts`

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

async function main() {
  const config = loadConfig();
  const client = new PaplaClient(config);

  const server = new McpServer({
    name: 'papla-media',
    version: '1.0.0'
  });

  // Register all tools
  registerTTSTool(server, client, config);
  registerVoiceTools(server, client);
  registerHistoryTools(server, client, config);

  // Connect transport
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
```

### 5.2 API Client

**Authentication:**

All requests include the `papla-api-key` header:

```typescript
async fetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const response = await fetch(`${this.baseUrl}${endpoint}`, {
    ...options,
    headers: {
      'papla-api-key': this.apiKey,
      ...options.headers
    }
  });

  if (!response.ok) {
    throw new PaplaApiError(response.status, await response.text());
  }

  return response;
}
```

### 5.3 Error Handling

**Error Types:**

```typescript
class PaplaApiError extends Error {
  constructor(
    public statusCode: number,
    public body: string
  ) {
    super(`Papla API error (${statusCode}): ${body}`);
  }
}

class ConfigError extends Error {
  constructor(message: string) {
    super(message);
  }
}

class FileOutputError extends Error {
  constructor(message: string, public path: string) {
    super(message);
  }
}
```

**Tool Error Responses:**

```typescript
// In tool handlers, catch errors and return structured responses
try {
  const result = await client.textToSpeech(voiceId, text);
  return { content: [{ type: 'text', text: JSON.stringify({ success: true, ... }) }] };
} catch (error) {
  if (error instanceof PaplaApiError) {
    return {
      content: [{ type: 'text', text: JSON.stringify({
        success: false,
        error: error.message,
        code: error.statusCode
      }) }],
      isError: true
    };
  }
  throw error;
}
```

---

## 6. Claude Desktop Integration

### Configuration File

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS):

```json
{
  "mcpServers": {
    "papla-media": {
      "command": "bun",
      "args": ["run", "/path/to/mcp-papla-media/src/index.ts"],
      "env": {
        "PAPLA_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

Or with bunx (if published):

```json
{
  "mcpServers": {
    "papla-media": {
      "command": "bunx",
      "args": ["mcp-papla-media"],
      "env": {
        "PAPLA_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

---

## 7. Security Considerations

### API Key Protection

- API key is passed via environment variable, not stored in code
- Never log the API key value
- Key is only transmitted to papla.media servers

### File System Access

- Output directory is validated at startup
- Files are only written to output directory or user-specified paths
- No execution of file contents

---

## 8. Implementation Phases

| Phase | Description | Dependencies | Complexity |
|-------|-------------|--------------|------------|
| 1 | Config loading and validation | None | Low |
| 2 | PaplaClient with basic error handling | Phase 1 | Medium |
| 3 | MCP server setup with stdio transport | Phase 2 | Low |
| 4 | File output utilities | Phase 1 | Low |

---

## 9. Open Questions

- [ ] Should we support a config file in addition to env vars?
- [ ] Rate limiting handling - retry with backoff?
- [ ] Should output directory be created automatically if missing?
