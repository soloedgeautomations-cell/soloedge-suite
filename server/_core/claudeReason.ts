/**
 * claudeReason.ts
 * Claude API reasoning upgrade for complex calls.
 * Activates when: transcript has 10+ lines, multi-language detected,
 * or job type is ambiguous/complex.
 * Falls back to GPT-4o-mini for simple calls (cost savings).
 */

import { ENV } from "./env";

interface ClaudeMessage {
  role: "user" | "assistant";
  content: string;
}

interface ClaudeReasonInput {
  systemPrompt: string;
  userContent: string;
  transcriptLineCount: number;
  language: string;
}

interface ClaudeReasonResult {
  content: string;
  model: "claude-3-5-haiku-20241022" | "gpt-4o-mini";
  usedClaude: boolean;
}

/**
 * Determines if a call is complex enough to warrant Claude reasoning.
 * Keeps costs low by only using Claude when it matters.
 */
function isComplexCall(transcriptLineCount: number, language: string): boolean {
  // Complex if: long conversation, non-English, or both
  const isLong = transcriptLineCount >= 10;
  const isNonEnglish = language === "Spanish" || language === "Chinese" || language === "es" || language === "zh";
  return isLong || isNonEnglish;
}

/**
 * Calls Claude API directly for complex call reasoning.
 * Uses claude-3-5-haiku (fast + cheap) not claude-3-opus.
 */
async function callClaude(systemPrompt: string, userContent: string): Promise<string> {
  const apiKey = ENV.anthropicApiKey;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        { role: "user", content: userContent } as ClaudeMessage,
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API error: ${response.status} — ${err}`);
  }

  const data = await response.json() as { content: Array<{ type: string; text: string }> };
  return data.content?.[0]?.text ?? "";
}

/**
 * Main export: routes to Claude or GPT-4o-mini based on call complexity.
 * Always returns a string (the LLM response content).
 */
export async function claudeReason(input: ClaudeReasonInput): Promise<ClaudeReasonResult> {
  const { systemPrompt, userContent, transcriptLineCount, language } = input;

  const usesClaude = isComplexCall(transcriptLineCount, language) && !!ENV.anthropicApiKey;

  if (usesClaude) {
    try {
      const content = await callClaude(systemPrompt, userContent);
      console.log(`[CLAUDE] ✓ Used Claude 3.5 Haiku for complex call (${transcriptLineCount} lines, lang: ${language})`);
      return { content, model: "claude-3-5-haiku-20241022", usedClaude: true };
    } catch (err) {
      console.log(`[CLAUDE] ⚠ Claude failed, falling back to GPT-4o-mini: ${(err as Error).message}`);
      // Fall through to GPT-4o-mini
    }
  }

  // GPT-4o-mini path (default for simple calls or Claude fallback)
  const apiKey = ENV.forgeApiKey;
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured");

  const apiUrl = ENV.forgeApiUrl
    ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions`
    : "https://forge.manus.im/v1/chat/completions";

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`GPT-4o-mini error: ${response.status} — ${err}`);
  }

  const data = await response.json() as { choices: Array<{ message: { content: string } }> };
  const content = data.choices?.[0]?.message?.content ?? "";
  return { content, model: "gpt-4o-mini", usedClaude: false };
}
