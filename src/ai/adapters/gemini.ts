import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import type { ProviderAdapter, DiscoveredModel, GenerateInput, GenerateOutput, NormalizedError, ProviderCreds, ErrorKind } from "./types";

function classifying(message: string): ErrorKind {
  if (/401|403|invalid_api_key/i.test(message)) return "auth";
  if (/429|rate_limit/i.test(message)) return "rate_limit";
  if (/timeout/i.test(message)) return "timeout";
  if (/network|fetch failed|econn/i.test(message)) return "network";
  return "unknown";
}

export class GeminiAdapter implements ProviderAdapter {
  readonly kind = "gemini";

  async discoverModels(_creds: ProviderCreds): Promise<DiscoveredModel[]> {
    return [
      { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", contextWindow: 2_000_000, freeTier: true },
      { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash", contextWindow: 1_000_000, freeTier: true },
      { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", contextWindow: 1_000_000, freeTier: true },
    ];
  }

  async testModel(creds: ProviderCreds, model: string): Promise<boolean> {
    try {
      const google = createGoogleGenerativeAI({ apiKey: creds.apiKey });
      const r = await generateText({ model: google(model), prompt: "ping", maxOutputTokens: 1 } as any);
      return Boolean(r.text);
    } catch {
      return false;
    }
  }

  async generate(input: GenerateInput, creds: ProviderCreds): Promise<GenerateOutput> {
    const google = createGoogleGenerativeAI({ apiKey: creds.apiKey });
    const r = await generateText({
      model: google(input.model),
      messages: input.messages.map((m) => ({ role: m.role, content: m.content })),
      temperature: input.temperature ?? 0.7,
      maxTokens: input.maxTokens,
      abortSignal: input.signal,
    } as any);
    return {
      text: r.text,
      usage: { tokensIn: r.usage?.promptTokens, tokensOut: r.usage?.completionTokens },
    };
  }

  normalizeError(e: unknown): NormalizedError {
    const message = String(e instanceof Error ? e.message : e);
    const kind = classifying(message);
    const retryable = kind === "network" || kind === "rate_limit" || kind === "timeout";
    return { retryable, kind, message };
  }
}
