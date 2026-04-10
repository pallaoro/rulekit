import { writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";

function buildTemplate(domain: string): string {
  return `schema: rulespec/v1
domain: "${domain}"

rules:
  - id: example-rule
    rule: "Replace this with your first business rule"
    context: "When this rule should apply"
    intent: inform
    prompt: "### Example Rule\\nWhen this rule should apply: Replace this with your first business rule."
`;
}

export async function init(
  file: string,
  flags: Record<string, string>,
): Promise<void> {
  if (existsSync(file)) {
    console.error(`${file} already exists`);
    process.exit(1);
  }

  const domain = flags.domain ?? "your domain here";
  await writeFile(file, buildTemplate(domain), "utf-8");
  console.log(`Created ${file}`);
}
