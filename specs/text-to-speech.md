# Text-to-Speech Specification

**Status:** Planned
**Version:** 1.0
**Last Updated:** 2025-01-17

---

## 1. Overview

### Purpose

The text-to-speech tool enables AI assistants to convert text into natural-sounding audio files using Papla Media's TTS API. This is the primary value-delivering capability of the MCP server.

### Goals

- **Simple generation** - Convert text to audio with minimal required parameters
- **Voice selection** - Allow specifying which voice to use for generation
- **Flexible output** - Support both user-specified paths and auto-generated filenames
- **Clear feedback** - Return the output file path and generation metadata

### Non-Goals

- **Audio streaming** - Real-time audio streaming to the client (MCP doesn't support this)
- **Audio playback** - Playing audio is the user's responsibility
- **Audio editing** - Post-processing or editing generated audio

---

## 2. Architecture

### Component Structure

```
src/
├── tools/
│   └── text-to-speech.ts    # TTS tool registration and handler
├── api/
│   └── papla-client.ts      # Papla API client wrapper
└── utils/
    └── file-output.ts       # File path resolution and writing
```

### Data Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   MCP Client    │────▶│   TTS Tool      │────▶│  Papla API      │
│   (Claude)      │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │                        │
                               │                        │ audio bytes
                               ▼                        ▼
                        ┌─────────────────┐     ┌─────────────────┐
                        │  File Output    │◀────│  API Response   │
                        │  (write to disk)│     │                 │
                        └─────────────────┘     └─────────────────┘
```

1. Claude invokes the `papla_tts` tool with text and voice_id
2. Tool validates input and calls Papla API
3. API returns audio bytes
4. Tool writes bytes to disk at specified or generated path
5. Tool returns success response with file path

---

## 3. Core Types

### 3.1 TTSInput

Input parameters for the text-to-speech tool.

```typescript
interface TTSInput {
  text: string;
  voice_id: string;
  output_path?: string;
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `text` | string | Yes | The text to convert to speech |
| `voice_id` | string | Yes | ID of the voice to use (from `papla_list_voices`) |
| `output_path` | string | No | Full path for output file. If omitted, auto-generates in output directory |

### 3.2 TTSOutput

Response from successful TTS generation.

```typescript
interface TTSOutput {
  success: boolean;
  file_path: string;
  voice_id: string;
  text_length: number;
  history_item_id?: string;
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `success` | boolean | Yes | Whether generation succeeded |
| `file_path` | string | Yes | Absolute path to the generated audio file |
| `voice_id` | string | Yes | The voice ID that was used |
| `text_length` | number | Yes | Character count of input text |
| `history_item_id` | string | No | ID of the history item (if returned by API) |

---

## 4. API / Behaviors

### 4.1 papla_tts

**Purpose:** Generate speech audio from text using a specified voice.

**MCP Tool Definition:**

```typescript
{
  name: 'papla_tts',
  title: 'Text to Speech',
  description: 'Generate speech audio from text using Papla Media TTS',
  inputSchema: {
    text: z.string().min(1).max(5000).describe('Text to convert to speech'),
    voice_id: z.string().describe('Voice ID to use for generation'),
    output_path: z.string().optional().describe('Output file path (auto-generated if omitted)')
  }
}
```

**Behavior:**

1. Validate text is non-empty and within limits
2. Resolve output path:
   - If provided, use as-is (create parent directories if needed)
   - If omitted, generate: `{PAPLA_OUTPUT_DIR}/tts-{timestamp}.mp3`
3. Call Papla API: `POST /v1/text_to_speech/{voice_id}`
4. Write response bytes to file
5. Return success response with file path

**Errors:**

| Error | Condition |
|-------|-----------|
| `VOICE_NOT_FOUND` | The specified voice_id does not exist |
| `TEXT_TOO_LONG` | Text exceeds API limits |
| `WRITE_ERROR` | Failed to write output file |
| `API_ERROR` | Papla API returned an error |

---

## 5. Configuration

| Variable | Type | Description | Default |
|----------|------|-------------|---------|
| `PAPLA_OUTPUT_DIR` | string | Directory for auto-generated output files | `~/papla-audio` |

---

## 6. Security Considerations

### Input Validation

- Text length is validated before API call
- Output paths are validated to prevent directory traversal
- Voice IDs are passed through to API (API validates existence)

### File System Safety

- Only writes to user-specified paths or configured output directory
- Creates parent directories with standard permissions
- Does not overwrite without explicit path specification

---

## 7. Implementation Phases

| Phase | Description | Dependencies | Complexity |
|-------|-------------|--------------|------------|
| 1 | Basic TTS with required voice_id and text | Server setup | Low |
| 2 | Add output path handling with defaults | Phase 1 | Low |
| 3 | Add history item ID tracking | Phase 1 | Low |

---

## 8. Open Questions

- [x] Streaming vs non-streaming endpoint → Using non-streaming
- [ ] Maximum text length supported by API?
- [ ] Audio format options (always mp3, or configurable)?
