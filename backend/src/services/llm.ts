import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config.js';

export interface GenerateTextOptions {
  system: string;
  prompt: string;
  maxTokens?: number;
}

export interface LlmService {
  provider: string;
  generateText(options: GenerateTextOptions): Promise<string>;
}

// ── Anthropic direct SDK ─────────────────────────────────────────────

class AnthropicLlmService implements LlmService {
  readonly provider = 'anthropic';
  private client: Anthropic;

  constructor(private readonly apiKey: string, private readonly model: string) {
    this.client = new Anthropic({ apiKey });
  }

  async generateText({ system, prompt, maxTokens = 1024 }: GenerateTextOptions): Promise<string> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: prompt }],
    });

    const first = response.content[0];
    if (!first || first.type !== 'text') {
      throw new Error('Unexpected Anthropic response type');
    }

    return first.text.trim();
  }
}

// ── Gateway (OpenAI-compatible or custom) ────────────────────────────

interface GatewayResponse {
  // OpenAI-compatible shape
  choices?: { message?: { content?: string } }[];
  // Simple shape (custom gateways)
  text?: string;
  output?: string;
  content?: string;
}

class GatewayLlmService implements LlmService {
  readonly provider = 'gateway';

  constructor(
    private readonly gatewayUrl: string,
    private readonly model: string,
    private readonly apiKey?: string,
  ) {}

  async generateText({ system, prompt, maxTokens = 1024 }: GenerateTextOptions): Promise<string> {
    const res = await fetch(this.gatewayUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: prompt },
        ],
        max_tokens: maxTokens,
        // Fallback fields for non-OpenAI gateways
        system,
        prompt,
        maxTokens,
      }),
    });

    if (!res.ok) {
      throw new Error(`Gateway LLM request failed: ${res.status} ${await res.text()}`);
    }

    const data = await res.json() as GatewayResponse;

    // Try OpenAI-compatible shape first, then simple shape
    const text =
      data.choices?.[0]?.message?.content ??
      data.text ??
      data.output ??
      data.content;

    if (!text) throw new Error('Gateway LLM response missing text content');
    return text.trim();
  }
}

// ── Unavailable fallback ─────────────────────────────────────────────

class UnavailableLlmService implements LlmService {
  readonly provider = 'unavailable';

  async generateText(): Promise<string> {
    throw new Error(
      'No LLM provider configured. Set EVA_LLM_PROVIDER=gateway with EVA_LLM_GATEWAY_URL, or configure ANTHROPIC_API_KEY.',
    );
  }
}

// ── Helpers ──────────────────────────────────────────────────────────

function normalizeJsonResponse(text: string): string {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return fenceMatch ? fenceMatch[1].trim() : trimmed;
}

// ── Singleton resolution ─────────────────────────────────────────────

let cachedService: LlmService | null = null;

export function getLlmService(): LlmService {
  if (cachedService) return cachedService;

  const model = config.llmModel;
  const provider = config.llmProvider;

  if ((provider === 'gateway' || provider === 'auto') && config.llmGatewayUrl) {
    cachedService = new GatewayLlmService(config.llmGatewayUrl, model, config.llmGatewayApiKey || undefined);
    return cachedService;
  }

  if ((provider === 'anthropic' || provider === 'auto') && config.anthropicApiKey) {
    cachedService = new AnthropicLlmService(config.anthropicApiKey, model);
    return cachedService;
  }

  cachedService = new UnavailableLlmService();
  return cachedService;
}

export async function generateJson<T>(options: GenerateTextOptions): Promise<T> {
  const raw = await getLlmService().generateText(options);
  return JSON.parse(normalizeJsonResponse(raw)) as T;
}
