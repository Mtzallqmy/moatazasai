import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import type { ProviderAdapter, DiscoveredModel, GenerateInput, GenerateOutput, NormalizedError, ProviderCreds, ErrorKind } from "./types";

function classifying(status: number | undefined): ErrorKind {
  if (status === 401 || status === 403) return "auth";
  if (status === 429) return "rate_limit";
  if (status === 408) return "timeout";
  if (status === undefined) return "network";
  if (status >= 500) return "network";
  return "unknown";
}

export class OpenAIAdapter implements ProviderAdapter {
  readonly kind = "openai";

  private client(apiKey: string, baseUrl?: string) {
    return new OpenAI({ apiKey, baseURL: baseUrl });
  }

  async discoverModels(creds: ProviderCreds): Promise<DiscoveredModel[]> {
    const client = this.client(creds.apiKey, creds.baseUrl);
    const list = await client.models.list();
    return list.data.map((m: { id: string }) => ({ id: m.id, name: m.id }));
  }

  async testModel(creds: ProviderCreds, model: string): Promise<boolean> {
    try {
      const client = this.client(creds.apiKey, creds.baseUrl);
      const r = await client.chat.completions.create({ model, messages: [{ role: "user", content: "ping" }], max_tokens: 1 });
      return Boolean(r.choices[0]);
    } catch {
      return false;
    }
  }

  async generate(input: GenerateInput, creds: ProviderCreds): Promise<GenerateOutput> {
    const client = this.client(creds.apiKey, creds.baseUrl);
    // تحويل messages إلى SDK格式. نتجاهل role="tool" مع tool_call_id (لأن المنصة لا تدعمه بعد)
    const sdkMessages: ChatCompletionMessageParam[] = input.messages
      .filter((m) => m.role !== "tool")
      .map((m) => ({
        role: m.role as "system" | "user" | "assistant",
        content: m.content,
      })) as ChatCompletionMessageParam[];
    const r = await client.chat.completions.create({
      model: input.model,
      messages: sdkMessages,
      temperature: input.temperature ?? 0.7,
      max_tokens: input.maxTokens,
    });
    return {
      text: r.choices[0]?.message?.content ?? "",
      usage: { tokensIn: r.usage?.prompt_tokens, tokensOut: r.usage?.completion_tokens },
    };
  }

  normalizeError(e: unknown): NormalizedError {
    if (e instanceof OpenAI.APIError) {
      const status = e.status;
      const retryable = status === undefined ? false : [408, 429, 500, 502, 503, 504].includes(status);
      return { retryable, kind: classifying(status), message: e.message, status };
    }
    return { retryable: false, kind: "unknown", message: String(e) };
  }
}
