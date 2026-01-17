import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { PaplaClient } from "../api/papla-client.js";
import type { ServerConfig } from "../config.js";
import { PaplaApiError } from "../utils/errors.js";
import { resolveOutputPath, writeAudioFile } from "../utils/file-output.js";

export function registerHistoryTools(
  server: McpServer,
  client: PaplaClient,
  config: ServerConfig
): void {
  // List history
  server.tool(
    "papla_list_history",
    "Get all previously generated audio items",
    {},
    async () => {
      try {
        const items = await client.listHistory();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ items, total: items.length }, null, 2),
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

  // Get single history item
  server.tool(
    "papla_get_history",
    "Get details about a specific history item",
    {
      history_item_id: z.string().describe("The history item ID to retrieve"),
    },
    async ({ history_item_id }) => {
      try {
        const item = await client.getHistory(history_item_id);
        return {
          content: [{ type: "text", text: JSON.stringify({ item }, null, 2) }],
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

  // Download history audio
  server.tool(
    "papla_download_history_audio",
    "Download audio from a previous generation",
    {
      history_item_id: z.string().describe("The history item ID"),
      output_path: z
        .string()
        .optional()
        .describe("Output file path (auto-generated if omitted)"),
    },
    async ({ history_item_id, output_path }) => {
      try {
        const filePath = await resolveOutputPath(
          config.outputDir,
          output_path,
          "history"
        );

        const audioData = await client.getHistoryAudio(history_item_id);
        await writeAudioFile(filePath, audioData);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                { success: true, file_path: filePath, history_item_id },
                null,
                2
              ),
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

  // Delete history item
  server.tool(
    "papla_delete_history",
    "Delete a history item and its audio",
    {
      history_item_id: z.string().describe("The history item ID to delete"),
    },
    async ({ history_item_id }) => {
      try {
        await client.deleteHistory(history_item_id);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ success: true, history_item_id }, null, 2),
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
