/**
 * AI provider interface. SERVER-ONLY — implementations live in `services/api` and are invoked
 * via tRPC/Inngest, never bundled into the client (keys must not reach the device).
 * Default text model is Claude Opus 4.8; high-volume short tasks use Haiku 4.5.
 */

export const CLAUDE_MODELS = {
  /** Reasoning-heavy: finance insights, copywriting. */
  default: 'claude-opus-4-8',
  /** High-volume / short: captions, auto-replies. */
  fast: 'claude-haiku-4-5',
} as const;

export type ClaudeModel = (typeof CLAUDE_MODELS)[keyof typeof CLAUDE_MODELS];

export interface TextGenRequest {
  system?: string;
  prompt: string;
  maxTokens?: number;
  model?: ClaudeModel;
}

export interface TextGenResult {
  text: string;
  model: string;
}

export interface ImageGenRequest {
  prompt: string;
  /** e.g. "1024x1024" */
  size?: string;
}

export interface ImageGenResult {
  /** URL or storage key of the generated asset. */
  url: string;
}

export interface AiProvider {
  generateText(req: TextGenRequest): Promise<TextGenResult>;
  generateImage(req: ImageGenRequest): Promise<ImageGenResult>;
}
