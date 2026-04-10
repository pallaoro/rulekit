import { parseRulekitFile } from "../parser.js";

export async function list(file: string): Promise<void> {
  const { rules } = await parseRulekitFile(file);

  const idWidth = Math.max(4, ...rules.map((r) => r.id.length));
  const intentWidth = 7;

  console.log(
    `${"ID".padEnd(idWidth)}  ${"INTENT".padEnd(intentWidth)}  RULE`,
  );
  console.log(`${"-".repeat(idWidth)}  ${"-".repeat(intentWidth)}  ${"-".repeat(40)}`);

  for (const rule of rules) {
    const ruleText =
      rule.rule.length > 60 ? rule.rule.slice(0, 57) + "..." : rule.rule;
    console.log(
      `${rule.id.padEnd(idWidth)}  ${rule.intent.padEnd(intentWidth)}  ${ruleText}`,
    );
  }
}
