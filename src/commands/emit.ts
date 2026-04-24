import { mkdir, writeFile, readdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, join } from "node:path";
import { parseRulespecFile } from "../parser.js";
import { emitRulesMd, emitDirName } from "../emitter.js";

async function emitOne(
  file: string,
  outdir: string,
  includeExamples: boolean,
): Promise<void> {
  const specFile = await parseRulespecFile(file);
  const dirName = emitDirName(specFile);
  const targetDir = resolve(outdir, dirName);
  await mkdir(targetDir, { recursive: true });

  const md = emitRulesMd(specFile, { includeExamples });
  const targetPath = resolve(targetDir, "SKILL.md");
  await writeFile(targetPath, md, "utf-8");

  console.log(`Emitted ${targetPath}`);
}

export async function emit(
  file: string,
  flags: Record<string, string>,
): Promise<void> {
  const outdir = flags.outdir ?? "skills";
  const includeExamples = flags["include-examples"] === "true";

  // If explicit --file, emit that one
  if (flags.file) {
    await emitOne(file, outdir, includeExamples);
    return;
  }

  const rulespecFiles = await findAllRulespecFiles(outdir);

  if (rulespecFiles.length === 0) {
    console.error(
      'No rulespec files found. Run "rulespec init --domain <name>" to create one.',
    );
    process.exit(1);
  }

  for (const f of rulespecFiles) {
    await emitOne(f, outdir, includeExamples);
  }
}

async function findAllRulespecFiles(outdir: string): Promise<string[]> {
  const found: string[] = [];

  // New layout: {outdir}/<domain>/rulespec.yaml
  try {
    const skillDirs = await readdir(outdir);
    for (const d of skillDirs) {
      const subDir = join(outdir, d);
      try {
        const s = await stat(subDir);
        if (!s.isDirectory()) continue;
      } catch {
        continue;
      }
      const p = join(subDir, "rulespec.yaml");
      if (existsSync(p)) found.push(p);
    }
  } catch {}

  // Legacy: *.rulespec.yaml at cwd
  try {
    const entries = await readdir(".");
    for (const f of entries) {
      if (f.endsWith(".rulespec.yaml")) found.push(f);
    }
  } catch {}

  return found;
}
