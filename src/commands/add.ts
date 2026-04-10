import type { Intent, Rule } from "../schema.js";
import { addRule } from "../writer.js";

const VALID_INTENTS = ["enforce", "inform", "suggest"];

export async function add(
  file: string,
  flags: Record<string, string>,
): Promise<void> {
  const { id, rule, context, intent } = flags;

  if (!id || !rule || !context || !intent) {
    console.error(
      "Usage: rulespec add --id <id> --rule <text> --context <text> --intent <enforce|inform|suggest>",
    );
    process.exit(1);
  }

  if (!VALID_INTENTS.includes(intent)) {
    console.error(`Invalid intent: "${intent}". Must be one of: ${VALID_INTENTS.join(", ")}`);
    process.exit(1);
  }

  const newRule: Rule = { id, rule, context, intent: intent as Intent, prompt: "" };
  await addRule(file, newRule);
  console.log(`Added rule "${id}"`);
}
