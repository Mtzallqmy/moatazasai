import type { ProviderAdapter } from "./types";
import { OpenAIAdapter } from "./openai";
import { AnthropicAdapter } from "./anthropic";
import { GeminiAdapter } from "./gemini";

export { OpenAIAdapter, AnthropicAdapter, GeminiAdapter };
export type { ProviderAdapter, DiscoveredModel, GenerateInput, GenerateOutput, NormalizedError, NormalizedUsage, ProviderCreds } from "./types";

const registry = new Map<string, ProviderAdapter>([
  ["openai", new OpenAIAdapter()],
  ["anthropic", new AnthropicAdapter()],
  ["gemini", new GeminiAdapter()],
]);

export function getAdapter(kind: string): ProviderAdapter {
  const adapter = registry.get(kind);
  if (!adapter) throw new Error(`Unknown provider: ${kind}`);
  return adapter;
}
