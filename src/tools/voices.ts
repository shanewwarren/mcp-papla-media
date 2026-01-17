import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { PaplaClient } from "../api/papla-client.js";
import { PaplaApiError } from "../utils/errors.js";

export function registerVoiceTools(
  server: McpServer,
  client: PaplaClient
): void {
  // List all voices
  server.tool(
    "papla_list_voices",
    "Get all available voices for text-to-speech",
    {},
    async () => {
      try {
        const voices = await client.listVoices();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ voices, total: voices.length }, null, 2),
            },
          ],
        };
      } catch (error) {
        if (error instanceof PaplaApiError) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  { success: false, error: error.message, code: error.statusCode },
                  null,
                  2
                ),
              },
            ],
            isError: true,
          };
        }
        throw error;
      }
    }
  );

  // Get single voice
  server.tool(
    "papla_get_voice",
    "Get details about a specific voice",
    {
      voice_id: z.string().describe("The voice ID to retrieve"),
    },
    async ({ voice_id }) => {
      try {
        const voice = await client.getVoice(voice_id);
        return {
          content: [{ type: "text", text: JSON.stringify({ voice }, null, 2) }],
        };
      } catch (error) {
        if (error instanceof PaplaApiError) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  { success: false, error: error.message, code: error.statusCode },
                  null,
                  2
                ),
              },
            ],
            isError: true,
          };
        }
        throw error;
      }
    }
  );

  // Add voice (clone)
  server.tool(
    "papla_add_voice",
    "Create a voice clone from an audio sample (minimum 10 seconds)",
    {
      name: z.string().min(1).describe("Name for the new voice"),
      audio_file_path: z.string().describe("Path to audio file for cloning"),
      description: z.string().optional().describe("Description of the voice"),
    },
    async ({ name, audio_file_path, description }) => {
      try {
        const voice = await client.addVoice(name, audio_file_path, description);
        return {
          content: [
            { type: "text", text: JSON.stringify({ success: true, voice }, null, 2) },
          ],
        };
      } catch (error) {
        if (error instanceof PaplaApiError) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  { success: false, error: error.message, code: error.statusCode },
                  null,
                  2
                ),
              },
            ],
            isError: true,
          };
        }
        throw error;
      }
    }
  );

  // Edit voice
  server.tool(
    "papla_edit_voice",
    "Update a voice name or description",
    {
      voice_id: z.string().describe("The voice ID to edit"),
      name: z.string().optional().describe("New name for the voice"),
      description: z.string().optional().describe("New description"),
    },
    async ({ voice_id, name, description }) => {
      try {
        const updates: { name?: string; description?: string } = {};
        if (name) updates.name = name;
        if (description) updates.description = description;

        const voice = await client.editVoice(voice_id, updates);
        return {
          content: [
            { type: "text", text: JSON.stringify({ success: true, voice }, null, 2) },
          ],
        };
      } catch (error) {
        if (error instanceof PaplaApiError) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  { success: false, error: error.message, code: error.statusCode },
                  null,
                  2
                ),
              },
            ],
            isError: true,
          };
        }
        throw error;
      }
    }
  );

  // Delete voice
  server.tool(
    "papla_delete_voice",
    "Delete a voice clone (cannot delete premade voices)",
    {
      voice_id: z.string().describe("The voice ID to delete"),
    },
    async ({ voice_id }) => {
      try {
        await client.deleteVoice(voice_id);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ success: true, voice_id }, null, 2),
            },
          ],
        };
      } catch (error) {
        if (error instanceof PaplaApiError) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  { success: false, error: error.message, code: error.statusCode },
                  null,
                  2
                ),
              },
            ],
            isError: true,
          };
        }
        throw error;
      }
    }
  );
}
