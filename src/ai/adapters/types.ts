export interface DiscoveredModel {
  id: string;
  name?: string;
  contextWindow?: number;
  capabilities?: { streaming?: boolean; tools?: boolean; vision?: boolean };
  freeTier?: boolean;
}

export type ErrorKind = "auth" | "rate_limit" | "network" | "timeout" | "content_policy" | "unknown";

export interface NormalizedError {
  retryable: boolean;
  kind: ErrorKind;
  message: string;
  status?: number;
}

export interface NormalizedUsage {
  tokensIn?: number;
  tokensOut?: number;
}

export type ChatRole = "system" | "user" | "assistant" | "tool";

export interface GenerateInput {
  model: string;
  messages: { role: ChatRole; content: string }[];
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}

export interface GenerateOutput {
  text: string;
  usage: NormalizedUsage;
}

export interface ProviderCreds {
  apiKey: string;
  baseUrl?: string;
}

export interface ProviderAdapter {
  readonly kind: string;
  discoverModels(creds: ProviderCreds): Promise<DiscoveredModel[]>;
  testModel(creds: ProviderCreds, model: string): Promise<boolean>;
  generate(input: GenerateInput, creds: ProviderCreds): Promise<GenerateOutput>;
  stream?(input: GenerateInput, creds: ProviderCreds): AsyncIterable<string>;
  normalizeError(e: unknown): NormalizedError;
}
