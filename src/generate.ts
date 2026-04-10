import type { Rule, RulespecFile } from "./schema.js";

function buildMetaPrompt(rule: Rule, domain: string): string {
  return `You are a prompt engineer. Given a business rule, generate a concise markdown prompt fragment that can be injected into a larger LLM system prompt.

Domain: ${domain}

Rule ID: ${rule.id}
Rule: ${rule.rule}
Context: ${rule.context}
Intent: ${rule.intent}

Intent guidelines:
- "enforce": The rule is mandatory. Use strong, directive language (e.g. "You must", "Always", "Never").
- "inform": The rule is guidance. Use neutral language that informs the LLM's behavior.
- "suggest": The rule is a recommendation. Use soft language (e.g. "Consider", "When possible").

Output format:
- Start with a markdown ### heading derived from the rule ID (convert kebab-case to Title Case)
- Follow with a single paragraph that combines the context and rule into a clear instruction
- Do NOT include any preamble, explanation, or extra formatting
- Output ONLY the markdown fragment`;
}

export async function generatePrompt(
  rule: Rule,
  file: RulespecFile,
): Promise<string> {
  if (!file.model) {
    throw new Error("No model configured in rulespec file");
  }

  // Dynamic import — ai is an optional peer dependency
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const moduleName = "ai";
  const { generateText } = (await import(moduleName).catch(() => {
    throw new Error(
      "Could not import 'ai' package. Install it with: npm install ai",
    );
  })) as { generateText: (opts: Record<string, unknown>) => Promise<{ text: string }> };

  // AI SDK 5+ supports plain model strings via AI Gateway (e.g. "openai/gpt-4o")
  const { text } = await generateText({
    model: file.model,
    prompt: buildMetaPrompt(rule, file.domain),
  });

  return text.trim();
}
