import { parseRulespecFile } from "../parser.js";

export async function validateCmd(file: string): Promise<void> {
  await parseRulespecFile(file);
  console.log(`${file} is valid`);
}
