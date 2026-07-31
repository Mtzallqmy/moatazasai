import Anthropic from "@anthropic-ai/sdk";
import type { ProviderAdapter, DiscoveredModel, GenerateInput, GenerateOutput, NormalizedError, ProviderCreds, ErrorKind } from "./types";

function classifying(status: number | undefined): ErrorKind {
  if (status === 401 || status === 403) return "auth";
  if (status === 429) return "rate_limit";
  if (status === 408) return "timeout";
  if (status === undefined) return "network";
  if (status >= 500) return "network";
  return "unknown";
}

export class AnthropicAdapter implements ProviderAdapter {
  readonly kind = "anthropic";

  private client(apiKey: string) {
    return new Anthropic({ apiKey });
  }

  async discoverModels(creds: ProviderCreds): Promise<DiscoveredModel[]> {
    // Anthropic لا يوفّر endpoint مستقرًا لقائمة النماذج مع API key عادية
    return [
      { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet" },
      { id: "claude-3-5-haiku-20241022", name: "Claude 3.5 Haiku" },
      { id: "claude-3-opus-20240229", name: "Claude 3 Opus" },
    ];
  }

  async testModel(creds: ProviderCreds, model: string): Promise<boolean> {
    try {
      const c = this.client(creds.apiKey);
      await c.messages.create({ model, max_tokens: 1, messages: [{ role: "user", content: "ping" }] });
      return true;
    } catch {
      return false;
    }
  }

  async generate(input: GenerateInput, creds: ProviderCreds): Promise<GenerateOutput> {
    const client = this.client(creds.apiKey);
    const systemMsg = input.messages.find((m) => m.role === "system")?.content;
    const userAssistantMsgs = input.messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: (m.role === "assistant" ? "assistant" : "user") as "user" | "assistant", content: m.content }));
    const r = await client.messages.create({
      model: input.model,
      max_tokens: input.maxTokens ?? 1024,
      messages: userAssistantMsgs as { role: "user" | "assistant"; content: string }[],
      ...(systemMsg ? { system: systemMsg } : {}),
      temperature: input.temperature ?? 0.7,
    }, input.signal ? { signal: input.signal } : undefined);
    return {
      text: r.content.map((b): string => (b.type === "text" ? b.text : "")).join(""),
      usage: { tokensIn: r.usage.input_tokens, tokensOut: r.usage.output_tokens },
    };
  }

  normalizeError(e: unknown): NormalizedError {
    if (e instanceof Anthropic.APIError) {
      const status = e.status;
      const retryable = status === undefined ? false : [408, 429, 500, 502, 503, 504].includes(status);
      return { retryable, kind: classifying(status), message: e.message, status };
    }
    return { retryable: false, kind: "unknown", message: String(e) };
  }
}
