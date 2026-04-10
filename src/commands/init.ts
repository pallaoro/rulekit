import { writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";

const TEMPLATE = `schema: rulespec/v1
domain: "your domain here"

rules:
  - id: example-rule
    rule: "Replace this with your first business rule"
    context: "When this rule should apply"
    intent: inform
    prompt: "### Example Rule\\nWhen this rule should apply: Replace this with your first business rule."
`;

export async function init(file: string): Promise<void> {
  if (existsSync(file)) {
    console.error(`${file} already exists`);
    process.exit(1);
  }

  await writeFile(file, TEMPLATE, "utf-8");
  console.log(`Created ${file}`);
}
