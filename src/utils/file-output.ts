import { mkdir, writeFile } from "fs/promises";
import { dirname, join } from "path";
import { FileOutputError } from "./errors.js";

export async function resolveOutputPath(
  outputDir: string,
  userPath?: string,
  prefix: string = "tts"
): Promise<string> {
  if (userPath) {
    return userPath;
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  return join(outputDir, `${prefix}-${timestamp}.mp3`);
}

export async function writeAudioFile(
  path: string,
  data: ArrayBuffer
): Promise<void> {
  try {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, Buffer.from(data));
  } catch (error) {
    throw new FileOutputError(
      `Failed to write audio file: ${error instanceof Error ? error.message : String(error)}`,
      path
    );
  }
}
