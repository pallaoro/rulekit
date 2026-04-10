import { readFile, writeFile } from "node:fs/promises";
import { parse, stringify } from "yaml";
import { parseRulekitFile } from "../parser.js";
import { compileRule, compileRules } from "../compiler.js";
import { generatePrompt } from "../generate.js";

export async function compile(file: string, ruleId?: string): Promise<void> {
  const rulekitFile = await parseRulekitFile(file);
  const useAI = !!rulekitFile.model;
  let changed = false;

  if (useAI) {
    console.log(`Using model: ${rulekitFile.model}`);
  }

  for (const rule of rulekitFile.rules) {
    if (ruleId && rule.id !== ruleId) continue;

    let newPrompt: string;
    if (useAI) {
      process.stdout.write(`Generating prompt for "${rule.id}"...`);
      newPrompt = await generatePrompt(rule, rulekitFile);
      console.log(" done");
    } else {
      newPrompt = compileRule(rule);
    }

    if (rule.prompt !== newPrompt) {
      rule.prompt = newPrompt;
      changed = true;
    }
  }

  if (ruleId && !rulekitFile.rules.some((r) => r.id === ruleId)) {
    console.error(`Rule "${ruleId}" not found`);
    process.exit(1);
  }

  if (changed) {
    const raw = await readFile(file, "utf-8");
    const data = parse(raw);
    data.rules = rulekitFile.rules;
    await writeFile(file, stringify(data), "utf-8");
    console.log("Prompts regenerated and saved.");
  } else {
    console.log("All prompts are up to date.");
  }

  console.log();
  console.log(compileRules(rulekitFile));
}
