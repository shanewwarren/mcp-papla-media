import { homedir } from "os";
import { join } from "path";

export interface ServerConfig {
  apiKey: string;
  outputDir: string;
  apiBaseUrl: string;
}

export function loadConfig(): ServerConfig {
  const apiKey = process.env.PAPLA_API_KEY;
  if (!apiKey) {
    console.error("Error: PAPLA_API_KEY environment variable is required");
    console.error("Get your API key at: https://app.papla.media");
    process.exit(1);
  }

  const outputDir = process.env.PAPLA_OUTPUT_DIR || join(homedir(), "papla-audio");
  const apiBaseUrl = process.env.PAPLA_API_BASE_URL || "https://papla.media";

  return { apiKey, outputDir, apiBaseUrl };
}
