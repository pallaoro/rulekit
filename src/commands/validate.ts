import { parseRulekitFile } from "../parser.js";

export async function validateCmd(file: string): Promise<void> {
  await parseRulekitFile(file);
  console.log(`${file} is valid`);
}
