export type Provider = "anthropic" | "gemini";

/** Current recommended defaults; user-overridable via env or Settings later. */
export const DEFAULT_CLAUDE_MODEL = "claude-opus-4-8";
export const DEFAULT_GEMINI_MODEL = "gemini-2.0-flash";

export function anthropicReady(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export function geminiReady(): boolean {
  return Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
}

/** Prefer Anthropic; fall back to Gemini if only that key is present. */
export function activeProvider(): Provider {
  if (anthropicReady()) return "anthropic";
  if (geminiReady()) return "gemini";
  return "anthropic";
}

export function providerStatus() {
  return {
    anthropic: anthropicReady(),
    gemini: geminiReady(),
    active: activeProvider(),
    ready: anthropicReady() || geminiReady(),
  };
}
