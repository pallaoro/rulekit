import { readFile, writeFile } from "node:fs/promises";
import { parse, stringify } from "yaml";
import { parseRulespecFile } from "../parser.js";
import { compileRule, compileRules } from "../compiler.js";
import { generatePrompt } from "../generate.js";

export async function compile(file: string, ruleId?: string): Promise<void> {
  const specFile = await parseRulespecFile(file);
  const useAI = !!specFile.model;
  let changed = false;

  if (useAI) {
    console.log(`Using model: ${specFile.model}`);
  }

  for (const rule of specFile.rules) {
    if (ruleId && rule.id !== ruleId) continue;

    let newPrompt: string;
    if (useAI) {
      process.stdout.write(`Generating prompt for "${rule.id}"...`);
      newPrompt = await generatePrompt(rule, specFile);
      console.log(" done");
    } else {
      newPrompt = compileRule(rule);
    }

    if (rule.prompt !== newPrompt) {
      rule.prompt = newPrompt;
      changed = true;
    }
  }

  if (ruleId && !specFile.rules.some((r) => r.id === ruleId)) {
    console.error(`Rule "${ruleId}" not found`);
    process.exit(1);
  }

  if (changed) {
    const raw = await readFile(file, "utf-8");
    const data = parse(raw);
    data.rules = specFile.rules;
    await writeFile(file, stringify(data), "utf-8");
    console.log("Prompts regenerated and saved.");
  } else {
    console.log("All prompts are up to date.");
  }

  console.log();
  console.log(compileRules(specFile));
}
