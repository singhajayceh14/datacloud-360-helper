import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { systemPrompt } from "./grounding";
import {
  DEFAULT_CLAUDE_MODEL,
  DEFAULT_GEMINI_MODEL,
  activeProvider,
  type Provider,
} from "./config";

export type ChatMessage = { role: "user" | "assistant"; content: string };

/**
 * Provider-agnostic grounded completion. Picks the provider (or uses the
 * requested one), builds the shared grounded system prompt, and calls Claude
 * via the official SDK or Gemini via fetch. Keys are read from env, server-side.
 */
export async function ask(opts: {
  messages: ChatMessage[];
  projectContext?: string;
  provider?: Provider;
}): Promise<string> {
  const provider = opts.provider ?? activeProvider();
  const system = systemPrompt(opts.projectContext);
  return provider === "gemini"
    ? askGemini(system, opts.messages)
    : askClaude(system, opts.messages);
}

async function askClaude(
  system: string,
  messages: ChatMessage[],
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set in .env.local.");

  const client = new Anthropic({ apiKey });
  const res = await client.messages.create({
    model: process.env.CLAUDE_MODEL || DEFAULT_CLAUDE_MODEL,
    max_tokens: 16000,
    system,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  });

  return res.content
    .map((block) => (block.type === "text" ? block.text : ""))
    .join("")
    .trim();
}

async function askGemini(
  system: string,
  messages: ChatMessage[],
): Promise<string> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not set in .env.local.");
  }

  const model = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: system }] },
      contents: messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
    }),
  });

  if (!res.ok) {
    throw new Error(`Gemini error ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  return parts
    .map((p: { text?: string }) => p.text ?? "")
    .join("")
    .trim();
}
