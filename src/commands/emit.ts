import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parseRulekitFile } from "../parser.js";
import { emitRulesMd, emitDirName } from "../emitter.js";

export async function emit(
  file: string,
  flags: Record<string, string>,
): Promise<void> {
  const rulekitFile = await parseRulekitFile(file);
  const outdir = flags.outdir ?? "rules";
  const includeExamples = flags["include-examples"] === "true";

  const dirName = emitDirName(rulekitFile);
  const targetDir = resolve(outdir, dirName);
  await mkdir(targetDir, { recursive: true });

  const md = emitRulesMd(rulekitFile, { includeExamples });
  const targetPath = resolve(targetDir, "RULES.md");
  await writeFile(targetPath, md, "utf-8");

  console.log(`Emitted ${targetPath}`);
}
