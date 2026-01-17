# Papla Media MCP Server Specifications

Design documentation for a Bun-based MCP server that wraps the Papla Media TTS API.

## Overview

This directory contains specifications for the project's features and systems. Each spec describes the design intent, architecture, and implementation guidance for a specific concern.

**Status Legend:**
- **Planned** - Design complete, not yet implemented
- **In Progress** - Currently being implemented
- **Implemented** - Feature complete and in production

---

## Core Features

| Spec | Status | Purpose |
|------|--------|---------|
| [text-to-speech.md](./text-to-speech.md) | Planned | Generate audio from text with configurable file output |
| [voice-management.md](./voice-management.md) | Planned | List, create (clone), edit, and delete voices |
| [history-management.md](./history-management.md) | Planned | List, retrieve, download audio, and delete history items |

## Infrastructure

| Spec | Status | Purpose |
|------|--------|---------|
| [server-configuration.md](./server-configuration.md) | Planned | API key handling, output directory config, stdio transport |

---

## MCP Tools Summary

| Tool | Description |
|------|-------------|
| `papla_tts` | Generate speech audio from text |
| `papla_list_voices` | List all available voices |
| `papla_get_voice` | Get details about a specific voice |
| `papla_add_voice` | Create a voice clone from audio |
| `papla_edit_voice` | Update voice name/description |
| `papla_delete_voice` | Delete a voice clone |
| `papla_list_history` | List past generations |
| `papla_get_history` | Get history item details |
| `papla_download_history_audio` | Download audio from history |
| `papla_delete_history` | Delete a history item |

---

## Using These Specs

### For Implementers

1. **Read the spec first** before writing code
2. **Check existing code** - specs describe intent, code describes reality
3. **Follow the patterns** outlined in each spec's Architecture section
4. **Update status** when implementation begins/completes

### For Reviewers

1. **Compare against spec** during code review
2. **Flag deviations** that aren't documented
3. **Propose spec updates** when implementation reveals better approaches

### Updating Specs

Specs are living documents. Update them when:
- Implementation reveals a better approach
- Requirements change
- New edge cases are discovered

---

## Related Documentation

- [CLAUDE.md](../CLAUDE.md) - Project-level AI guidance
- [Papla Media API Docs](https://papla.media/docs) - Official API documentation
