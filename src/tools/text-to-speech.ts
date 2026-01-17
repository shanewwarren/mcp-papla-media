import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { PaplaClient } from "../api/papla-client.js";
import type { ServerConfig } from "../config.js";
import { PaplaApiError } from "../utils/errors.js";
import { resolveOutputPath, writeAudioFile } from "../utils/file-output.js";

export function registerTTSTool(
  server: McpServer,
  client: PaplaClient,
  config: ServerConfig
): void {
  server.tool(
    "papla_tts",
    "Generate speech audio from text using Papla Media TTS",
    {
      text: z.string().min(1).max(5000).describe("Text to convert to speech"),
      voice_id: z.string().describe("Voice ID to use for generation"),
      output_path: z
        .string()
        .optional()
        .describe("Output file path (auto-generated if omitted)"),
    },
    async ({ text, voice_id, output_path }) => {
      try {
        const filePath = await resolveOutputPath(
          config.outputDir,
          output_path,
          "tts"
        );

        const audioData = await client.textToSpeech(voice_id, text);
        await writeAudioFile(filePath, audioData);

        const result = {
          success: true,
          file_path: filePath,
          voice_id,
          text_length: text.length,
        };

        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        if (error instanceof PaplaApiError) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    success: false,
                    error: error.message,
                    code: error.statusCode,
                  },
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
