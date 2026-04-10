export type { Intent, Rule, RulekitFile, Source, Example } from "./schema.js";
export type { CompileOptions } from "./compiler.js";
export type { EmitOptions } from "./emitter.js";
export { compileRule, compileRules } from "./compiler.js";
export { emitRulesMd, emitDirName } from "./emitter.js";
export { generatePrompt } from "./generate.js";
export { parseRulekitFile } from "./parser.js";
export { validate } from "./schema.js";

import { parseRulekitFile } from "./parser.js";
import type { CompileOptions } from "./compiler.js";

export async function loadRules(
  path: string = "rulekit.yaml",
  options?: CompileOptions,
): Promise<string> {
  const file = await parseRulekitFile(path);
  const { includeHeader = true } = options ?? {};
  const parts: string[] = [];

  if (includeHeader) {
    parts.push("## Rules\n");
  }

  parts.push(file.rules.map((r) => r.prompt).join("\n\n"));

  return parts.join("\n");
}
