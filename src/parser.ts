import { readFile } from "node:fs/promises";
import { parse } from "yaml";
import { validate, type RulekitFile } from "./schema.js";

export async function parseRulekitFile(path: string): Promise<RulekitFile> {
  let content: string;
  try {
    content = await readFile(path, "utf-8");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error(
        `File not found: ${path}\nRun "rulekit init" to create one.`,
      );
    }
    throw err;
  }

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
