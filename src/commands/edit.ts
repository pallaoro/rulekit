import type { Intent } from "../schema.js";
import { editRule } from "../writer.js";

const VALID_INTENTS = ["enforce", "inform", "suggest"];

export async function edit(
  file: string,
  id: string,
  flags: Record<string, string>,
): Promise<void> {
  const { rule, context, intent } = flags;

  if (!rule && !context && !intent) {
    console.error(
      "Usage: rulespec edit <id> [--rule <text>] [--context <text>] [--intent <type>]",
    );
    process.exit(1);
  }

  if (intent && !VALID_INTENTS.includes(intent)) {
    console.error(
      `Invalid intent: "${intent}". Must be one of: ${VALID_INTENTS.join(", ")}`,
    );
    process.exit(1);
  }

  await editRule(file, id, {
    rule: rule || undefined,
    context: context || undefined,
    intent: (intent as Intent) || undefined,
  });
  console.log(`Updated rule "${id}"`);
}
