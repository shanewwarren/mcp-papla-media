# Voice Management Specification

**Status:** Planned
**Version:** 1.0
**Last Updated:** 2025-01-17

---

## 1. Overview

### Purpose

Voice management tools enable AI assistants to discover available voices, create custom voice clones, and manage the user's voice library. This allows for personalized TTS experiences using custom or pre-made voices.

### Goals

- **Voice discovery** - List all available voices with useful metadata
- **Voice cloning** - Create new voices from audio samples
- **Voice editing** - Update voice names and settings
- **Voice cleanup** - Delete voices no longer needed

### Non-Goals

- **Voice quality assessment** - Evaluating clone quality programmatically
- **Audio sample management** - Managing source audio files for cloning
- **Voice sharing** - Sharing voices between accounts

---

## 2. Architecture

### Component Structure

```
src/
├── tools/
│   ├── list-voices.ts       # List all voices tool
│   ├── get-voice.ts         # Get single voice details
│   ├── add-voice.ts         # Create voice clone tool
│   ├── edit-voice.ts        # Edit voice tool
│   └── delete-voice.ts      # Delete voice tool
└── api/
    └── papla-client.ts      # Papla API client (shared)
```

---

## 3. Core Types

### 3.1 Voice

Represents a voice available for TTS.

```typescript
interface Voice {
  voice_id: string;
  name: string;
  category: 'premade' | 'cloned';
  preview_url?: string;
  labels?: Record<string, string>;
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `voice_id` | string | Yes | Unique identifier for the voice |
| `name` | string | Yes | Display name of the voice |
| `category` | string | Yes | Whether voice is premade or user-cloned |
| `preview_url` | string | No | URL to sample audio of this voice |
| `labels` | object | No | Key-value metadata (accent, gender, etc.) |

### 3.2 AddVoiceInput

Input for creating a voice clone.

```typescript
interface AddVoiceInput {
  name: string;
  audio_file_path: string;
  description?: string;
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Name for the new voice |
| `audio_file_path` | string | Yes | Path to audio file (min 10 seconds) |
| `description` | string | No | Optional description of the voice |

---

## 4. API / Behaviors

### 4.1 papla_list_voices

**Purpose:** Retrieve all available voices (premade and custom clones).

**MCP Tool Definition:**

```typescript
{
  name: 'papla_list_voices',
  title: 'List Voices',
  description: 'Get all available voices for text-to-speech',
  inputSchema: {}  // No parameters
}
```

**Response:**

```typescript
{
  voices: Voice[];
  total: number;
}
```

**Papla API:** `GET /v1/voices`

---

### 4.2 papla_get_voice

**Purpose:** Get detailed information about a specific voice.

**MCP Tool Definition:**

```typescript
{
  name: 'papla_get_voice',
  title: 'Get Voice',
  description: 'Get details about a specific voice',
  inputSchema: {
    voice_id: z.string().describe('The voice ID to retrieve')
  }
}
```

**Response:**

```typescript
{
  voice: Voice;
}
```

**Papla API:** `GET /v1/voices/{voice_id}`

---

### 4.3 papla_add_voice

**Purpose:** Create a new voice clone from an audio sample.

**MCP Tool Definition:**

```typescript
{
  name: 'papla_add_voice',
  title: 'Add Voice',
  description: 'Create a voice clone from an audio sample (minimum 10 seconds)',
  inputSchema: {
    name: z.string().min(1).describe('Name for the new voice'),
    audio_file_path: z.string().describe('Path to audio file for cloning'),
    description: z.string().optional().describe('Description of the voice')
  }
}
```

**Behavior:**

1. Validate audio file exists and is readable
2. Read audio file bytes
3. POST to Papla API with multipart form data
4. Return created voice details

**Response:**

```typescript
{
  success: boolean;
  voice: Voice;
}
```

**Papla API:** `POST /v1/voices/add`

**Errors:**

| Error | Condition |
|-------|-----------|
| `FILE_NOT_FOUND` | Audio file does not exist |
| `AUDIO_TOO_SHORT` | Audio sample less than 10 seconds |
| `INVALID_FORMAT` | Audio format not supported |

---

### 4.4 papla_edit_voice

**Purpose:** Update an existing voice's metadata.

**MCP Tool Definition:**

```typescript
{
  name: 'papla_edit_voice',
  title: 'Edit Voice',
  description: 'Update a voice name or description',
  inputSchema: {
    voice_id: z.string().describe('The voice ID to edit'),
    name: z.string().optional().describe('New name for the voice'),
    description: z.string().optional().describe('New description')
  }
}
```

**Response:**

```typescript
{
  success: boolean;
  voice: Voice;
}
```

**Papla API:** `POST /v1/voices/{voice_id}/edit`

---

### 4.5 papla_delete_voice

**Purpose:** Remove a voice from the user's library.

**MCP Tool Definition:**

```typescript
{
  name: 'papla_delete_voice',
  title: 'Delete Voice',
  description: 'Delete a voice clone (cannot delete premade voices)',
  inputSchema: {
    voice_id: z.string().describe('The voice ID to delete')
  }
}
```

**Response:**

```typescript
{
  success: boolean;
  voice_id: string;
}
```

**Papla API:** `DELETE /v1/voices/{voice_id}`

**Errors:**

| Error | Condition |
|-------|-----------|
| `VOICE_NOT_FOUND` | Voice ID does not exist |
| `CANNOT_DELETE_PREMADE` | Attempted to delete a premade voice |

---

## 5. Security Considerations

### File Access

- `papla_add_voice` reads local files - validate path is accessible
- Only read audio files, never write or execute

### Data Protection

- Voice IDs are user-scoped by the API key
- Cannot access other users' cloned voices

---

## 6. Implementation Phases

| Phase | Description | Dependencies | Complexity |
|-------|-------------|--------------|------------|
| 1 | List and get voices | Server setup | Low |
| 2 | Delete voice | Phase 1 | Low |
| 3 | Add voice (clone) with file upload | Phase 1 | Medium |
| 4 | Edit voice | Phase 1 | Low |

---

## 7. Open Questions

- [ ] What audio formats does Papla accept for cloning?
- [ ] Is there a maximum audio file size?
- [ ] Can voice labels be edited, or just name/description?
