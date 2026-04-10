import type { Rule, RulekitFile } from "./schema.js";

export interface CompileOptions {
  includeHeader?: boolean;
}

const INTENT_PREFIX: Record<string, string> = {
  enforce: "**You must follow this rule.** ",
  inform: "",
  suggest: "Consider the following: ",
};

function kebabToTitle(id: string): string {
  return id
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function endsWithPunctuation(text: string): boolean {
  return /[.!?]$/.test(text.trim());
}

export function compileRule(rule: Rule): string {
  const title = kebabToTitle(rule.id);
  const prefix = INTENT_PREFIX[rule.intent] ?? "";
  const ruleText = endsWithPunctuation(rule.rule)
    ? rule.rule
    : rule.rule + ".";

  return `### ${title}\n${prefix}${rule.context}: ${ruleText}`;
}

export function compileRules(
  file: RulekitFile,
  options: CompileOptions = {},
): string {
  const { includeHeader = true } = options;
  const parts: string[] = [];

  if (includeHeader) {
    parts.push("## Rules\n");
  }

  parts.push(file.rules.map(compileRule).join("\n\n"));

  return parts.join("\n");
}
