import { readFile } from "fs/promises";
import { PaplaApiError } from "../utils/errors.js";

export interface Voice {
  voice_id: string;
  name: string;
  category?: "premade" | "cloned";
  preview_url?: string;
  labels?: Record<string, string>;
}

export interface HistoryItem {
  history_item_id: string;
  voice_id: string;
  voice_name?: string;
  text: string;
  created_at?: string;
  character_count?: number;
}

export class PaplaClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: { apiKey: string; baseUrl: string }) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl;
  }

  private async fetch(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        "papla-api-key": this.apiKey,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const body = await response.text();
      throw new PaplaApiError(response.status, body);
    }

    return response;
  }

  // Text-to-Speech
  async textToSpeech(voiceId: string, text: string): Promise<ArrayBuffer> {
    const response = await this.fetch(`/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });
    return response.arrayBuffer();
  }

  // Voices
  async listVoices(): Promise<Voice[]> {
    const response = await this.fetch("/v1/voices");
    const data = await response.json();
    return data.voices || data;
  }

  async getVoice(voiceId: string): Promise<Voice> {
    const response = await this.fetch(`/v1/voices/${voiceId}`);
    return response.json();
  }

  async addVoice(
    name: string,
    audioFilePath: string,
    description?: string
  ): Promise<Voice> {
    const audioData = await readFile(audioFilePath);
    const formData = new FormData();
    formData.append("name", name);
    formData.append(
      "files",
      new Blob([audioData], { type: "audio/mpeg" }),
      "audio.mp3"
    );
    if (description) {
      formData.append("description", description);
    }

    const response = await this.fetch("/v1/voices/add", {
      method: "POST",
      body: formData,
    });
    return response.json();
  }

  async editVoice(
    voiceId: string,
    updates: { name?: string; description?: string }
  ): Promise<Voice> {
    const response = await this.fetch(`/v1/voices/${voiceId}/edit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    });
    return response.json();
  }

  async deleteVoice(voiceId: string): Promise<void> {
    await this.fetch(`/v1/voices/${voiceId}`, {
      method: "DELETE",
    });
  }

  // History
  async listHistory(): Promise<HistoryItem[]> {
    const response = await this.fetch("/v1/history");
    const data = await response.json();
    return data.history || data;
  }

  async getHistory(historyItemId: string): Promise<HistoryItem> {
    const response = await this.fetch(`/v1/history/${historyItemId}`);
    return response.json();
  }

  async getHistoryAudio(historyItemId: string): Promise<ArrayBuffer> {
    const response = await this.fetch(`/v1/history/${historyItemId}/audio`);
    return response.arrayBuffer();
  }

  async deleteHistory(historyItemId: string): Promise<void> {
    await this.fetch(`/v1/history/${historyItemId}`, {
      method: "DELETE",
    });
  }
}
