# Papla Media MCP Server

An MCP (Model Context Protocol) server that wraps the [Papla Media](https://papla.media) text-to-speech API, enabling AI assistants like Claude to generate speech audio.

## Features

- **Text-to-Speech**: Generate high-quality speech audio from text
- **Voice Management**: List, clone, edit, and delete voices
- **History Management**: Browse and download previously generated audio

## Prerequisites

- [Bun](https://bun.sh) runtime
- A Papla Media API key (get one at [app.papla.media](https://app.papla.media))

## Installation

### Add to Claude Code

For full MCP documentation, see [Claude Code MCP docs](https://code.claude.com/docs/en/mcp).

First, clone and install the server:

```bash
git clone https://github.com/shanewwarren/mcp-papla-media.git
cd mcp-papla-media
bun install
```

Then add to Claude Code:

```bash
claude mcp add --transport stdio \
  --env PAPLA_API_KEY=your-api-key-here \
  papla-media \
  -- /path/to/mcp-papla-media/bin/papla-media
```

Or add directly to your `.mcp.json` configuration file:

```json
{
  "mcpServers": {
    "papla-media": {
      "type": "stdio",
      "command": "/path/to/mcp-papla-media/bin/papla-media",
      "env": {
        "PAPLA_API_KEY": "${PAPLA_API_KEY}"
      }
    }
  }
}
```

### Configuration Options

| Environment Variable | Required | Default | Description |
|---------------------|----------|---------|-------------|
| `PAPLA_API_KEY` | Yes | - | Your Papla Media API key |
| `PAPLA_OUTPUT_DIR` | No | `~/papla-audio` | Directory for generated audio files |
| `PAPLA_API_BASE_URL` | No | `https://api.papla.media` | API base URL (for testing) |

## Available Tools

### Text-to-Speech

| Tool | Description |
|------|-------------|
| `papla_tts` | Generate speech audio from text (up to 5000 characters) |

### Voice Management

| Tool | Description |
|------|-------------|
| `papla_list_voices` | Get all available voices (premade and cloned) |
| `papla_get_voice` | Get details about a specific voice |
| `papla_add_voice` | Create a voice clone from an audio sample (min 10 seconds) |
| `papla_edit_voice` | Update a voice's name or description |
| `papla_delete_voice` | Delete a cloned voice |

### History Management

| Tool | Description |
|------|-------------|
| `papla_list_history` | Get all previously generated audio items |
| `papla_get_history` | Get details about a specific history item |
| `papla_download_history_audio` | Download audio from a previous generation |
| `papla_delete_history` | Delete a history item and its audio |

## Development

```bash
# Install dependencies
bun install

# Run locally
PAPLA_API_KEY=your-key bun run src/index.ts

# Type check
bun run typecheck
```

## License

MIT
