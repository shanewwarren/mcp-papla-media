# History Management Specification

**Status:** Planned
**Version:** 1.0
**Last Updated:** 2025-01-17

---

## 1. Overview

### Purpose

History management tools allow AI assistants to access previously generated audio, retrieve past generations for reuse, and clean up old history items. This enables workflows like "use that audio I generated earlier" or "delete old generations to free up storage."

### Goals

- **Browse history** - List past TTS generations with metadata
- **Retrieve details** - Get information about specific history items
- **Download audio** - Re-download audio from past generations
- **Cleanup** - Delete history items no longer needed

### Non-Goals

- **History search** - Full-text search of past generations
- **History analytics** - Usage statistics or insights
- **Batch operations** - Deleting multiple items at once

---

## 2. Architecture

### Component Structure

```
src/
├── tools/
│   ├── list-history.ts      # List history items tool
│   ├── get-history.ts       # Get single history item
│   ├── download-history.ts  # Download audio from history
│   └── delete-history.ts    # Delete history item tool
└── api/
    └── papla-client.ts      # Papla API client (shared)
```

---

## 3. Core Types

### 3.1 HistoryItem

Represents a past TTS generation.

```typescript
interface HistoryItem {
  history_item_id: string;
  voice_id: string;
  voice_name: string;
  text: string;
  created_at: string;  // ISO 8601 timestamp
  character_count: number;
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `history_item_id` | string | Yes | Unique identifier for this generation |
| `voice_id` | string | Yes | Voice ID used for generation |
| `voice_name` | string | Yes | Display name of the voice |
| `text` | string | Yes | The text that was converted |
| `created_at` | string | Yes | When the audio was generated |
| `character_count` | number | Yes | Number of characters in the text |

---

## 4. API / Behaviors

### 4.1 papla_list_history

**Purpose:** Retrieve all past TTS generations.

**MCP Tool Definition:**

```typescript
{
  name: 'papla_list_history',
  title: 'List History',
  description: 'Get all previously generated audio items',
  inputSchema: {}  // No parameters
}
```

**Response:**

```typescript
{
  items: HistoryItem[];
  total: number;
}
```

**Papla API:** `GET /v1/history`

---

### 4.2 papla_get_history

**Purpose:** Get detailed information about a specific history item.

**MCP Tool Definition:**

```typescript
{
  name: 'papla_get_history',
  title: 'Get History Item',
  description: 'Get details about a specific history item',
  inputSchema: {
    history_item_id: z.string().describe('The history item ID to retrieve')
  }
}
```

**Response:**

```typescript
{
  item: HistoryItem;
}
```

**Papla API:** `GET /v1/history/{history_item_id}`

---

### 4.3 papla_download_history_audio

**Purpose:** Download the audio file from a history item.

**MCP Tool Definition:**

```typescript
{
  name: 'papla_download_history_audio',
  title: 'Download History Audio',
  description: 'Download audio from a previous generation',
  inputSchema: {
    history_item_id: z.string().describe('The history item ID'),
    output_path: z.string().optional().describe('Output file path (auto-generated if omitted)')
  }
}
```

**Behavior:**

1. Resolve output path (same logic as TTS tool)
2. Fetch audio from Papla API
3. Write to disk
4. Return file path

**Response:**

```typescript
{
  success: boolean;
  file_path: string;
  history_item_id: string;
}
```

**Papla API:** `GET /v1/history/{history_item_id}/audio`

---

### 4.4 papla_delete_history

**Purpose:** Remove a history item.

**MCP Tool Definition:**

```typescript
{
  name: 'papla_delete_history',
  title: 'Delete History Item',
  description: 'Delete a history item and its audio',
  inputSchema: {
    history_item_id: z.string().describe('The history item ID to delete')
  }
}
```

**Response:**

```typescript
{
  success: boolean;
  history_item_id: string;
}
```

**Papla API:** `DELETE /v1/history/{history_item_id}`

**Errors:**

| Error | Condition |
|-------|-----------|
| `ITEM_NOT_FOUND` | History item ID does not exist |

---

## 5. Security Considerations

### Data Scope

- History is scoped to the API key holder
- Cannot access other users' history items

### File Writing

- `papla_download_history_audio` writes files - same path validation as TTS tool

---

## 6. Implementation Phases

| Phase | Description | Dependencies | Complexity |
|-------|-------------|--------------|------------|
| 1 | List and get history items | Server setup | Low |
| 2 | Download history audio | Phase 1, file output utils | Low |
| 3 | Delete history item | Phase 1 | Low |

---

## 7. Open Questions

- [ ] Is history paginated by the API? Need to handle pagination?
- [ ] How long does Papla retain history items?
- [ ] Is there a storage limit on history?
