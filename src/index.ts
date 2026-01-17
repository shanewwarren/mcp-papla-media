import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { PaplaClient } from "./api/papla-client.js";
import { loadConfig } from "./config.js";
import { registerHistoryTools } from "./tools/history.js";
import { registerTTSTool } from "./tools/text-to-speech.js";
import { registerVoiceTools } from "./tools/voices.js";

async function main() {
  const config = loadConfig();

  const client = new PaplaClient({
    apiKey: config.apiKey,
    baseUrl: config.apiBaseUrl,
  });

  const server = new McpServer({
    name: "papla-media",
    version: "1.0.0",
  });

  // Register all tools
  registerTTSTool(server, client, config);
  registerVoiceTools(server, client);
  registerHistoryTools(server, client, config);

  // Connect via stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
