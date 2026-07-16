import "server-only";
import fs from "node:fs";
import path from "node:path";

let cached: string | null = null;

/** The curated Data 360 knowledge base (reference/grounding.md), read once. */
export function loadGrounding(): string {
  if (cached !== null) return cached;
  try {
    cached = fs.readFileSync(
      path.join(process.cwd(), "reference", "grounding.md"),
      "utf8",
    );
  } catch {
    cached = "";
  }
  return cached;
}

/**
 * Build the grounded system prompt. Both providers receive the same prompt so
 * answers stay consistent across Claude and Gemini.
 */
export function systemPrompt(projectContext?: string): string {
  const grounding = loadGrounding();
  const parts = [
    "You are the Data 360 Assistant — a grounded expert on Salesforce Data Cloud 360 (formerly Data Cloud) implementation design.",
    "Answer from the reference below and the current project context. Be precise and practical. If the reference does not cover something, say so rather than inventing details.",
    "\n\n=== DATA 360 REFERENCE ===\n" + grounding,
  ];
  if (projectContext && projectContext.trim()) {
    parts.push("\n\n=== CURRENT PROJECT CONTEXT ===\n" + projectContext);
  }
  return parts.join("");
}
