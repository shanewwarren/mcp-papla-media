# Papla Media MCP Server

An MCP (Model Context Protocol) server that wraps the Papla Media text-to-speech API, enabling AI assistants like Claude to generate speech audio.

## Project Overview

This is a TypeScript MCP server built with **Bun** that provides tools for:
- Text-to-speech generation
- Voice management (list, clone, edit, delete)
- History management (browse and retrieve past generations)

## Specifications

**IMPORTANT:** Before implementing any feature, consult `specs/README.md`.

- **Assume NOT implemented.** Specs describe intent; code describes reality.
- **Check the codebase first.** Search actual code before concluding.
- **Use specs as guidance.** Follow design patterns in relevant spec.
- **Spec index:** `specs/README.md` lists all specs by category.

## Key Files

```
mcp-papla-media/
├── specs/                   # Design specifications
│   ├── README.md            # Spec index
│   ├── text-to-speech.md    # TTS tool spec
│   ├── voice-management.md  # Voice tools spec
│   ├── history-management.md # History tools spec
│   └── server-configuration.md # Server setup spec
├── src/                     # (to be created)
│   ├── index.ts             # Entry point
│   ├── config.ts            # Configuration
│   ├── server.ts            # MCP server setup
│   ├── api/
│   │   └── papla-client.ts  # API client
│   ├── tools/               # Tool implementations
│   └── utils/               # Shared utilities
└── CLAUDE.md                # This file
```

## Configuration

The server requires one environment variable:

```bash
PAPLA_API_KEY=your-api-key-here  # Required - get from https://app.papla.media
PAPLA_OUTPUT_DIR=~/papla-audio   # Optional - default output directory
```

## External API

- **Base URL:** `https://papla.media`
- **Auth Header:** `papla-api-key`
- **API Docs:** https://papla.media/docs

## Development Commands

```bash
# Install dependencies
bun install

# Run locally (no build step needed)
PAPLA_API_KEY=xxx bun run src/index.ts

# Type check
bun run typecheck
```

## Tool Naming Convention

All tools are prefixed with `papla_` to namespace them:
- `papla_tts`
- `papla_list_voices`
- `papla_add_voice`
- etc.

## MCP SDK Patterns

Use the high-level `McpServer` API with Zod schemas:

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod';

server.registerTool(
  'papla_tts',
  {
    title: 'Text to Speech',
    description: 'Generate speech audio from text',
    inputSchema: {
      text: z.string().describe('Text to convert'),
      voice_id: z.string().describe('Voice ID to use')
    }
  },
  async ({ text, voice_id }) => {
    // Implementation
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  }
);
```

## Error Handling

Return structured error responses, don't throw:

```typescript
return {
  content: [{ type: 'text', text: JSON.stringify({
    success: false,
    error: 'Voice not found'
  }) }],
  isError: true
};
```
