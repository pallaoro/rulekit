import { readFile, writeFile } from "node:fs/promises";
import { parse, stringify } from "yaml";
import { validate, type Rule } from "./schema.js";
import { compileRule } from "./compiler.js";

async function readAndValidate(path: string) {
  const content = await readFile(path, "utf-8");
  const data = parse(content);
  const result = validate(data);
  if (!result.ok) {
    const messages = result.errors
      .map((e) => `  ${e.path}: ${e.message}`)
      .join("\n");
    throw new Error(`Invalid rulekit file:\n${messages}`);
  }
  return result.value;
}

export async function addRule(path: string, rule: Rule): Promise<void> {
  const file = await readAndValidate(path);

  if (file.rules.some((r) => r.id === rule.id)) {
    throw new Error(`Rule with id "${rule.id}" already exists`);
  }

  const ruleWithPrompt = { ...rule, prompt: compileRule(rule) };
  file.rules.push(ruleWithPrompt);
  await writeFile(path, stringify(file), "utf-8");
}

export async function removeRule(path: string, id: string): Promise<void> {
  const file = await readAndValidate(path);

  const index = file.rules.findIndex((r) => r.id === id);
  if (index === -1) {
    throw new Error(`Rule with id "${id}" not found`);
  }

  file.rules.splice(index, 1);

  if (file.rules.length === 0) {
    throw new Error("Cannot remove the last rule");
  }

  await writeFile(path, stringify(file), "utf-8");
}
