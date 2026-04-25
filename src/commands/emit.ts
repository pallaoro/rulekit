import { mkdir, writeFile, readdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, join, dirname } from "node:path";
import { parseRulespecFile } from "../parser.js";
import { emitRulesMd, emitDirName } from "../emitter.js";
import { knownAgentDirs, resolveAgentDir } from "../agents.js";

export async function emit(
  file: string,
  flags: Record<string, string>,
): Promise<void> {
  const includeExamples = flags["include-examples"] === "true";
  const global = flags.global === "true";

  if (flags.outdir && flags.agent) {
    console.error("--outdir and --agent are mutually exclusive");
    process.exit(1);
  }

  let overrideBase: string | undefined;
  if (flags.agent) {
    try {
      overrideBase = resolveAgentDir(flags.agent, global);
    } catch (err) {
      console.error((err as Error).message);
      process.exit(1);
    }
  }
  if (flags.outdir) overrideBase = flags.outdir;

  let sourceFiles: string[];
  if (flags.file) {
    sourceFiles = [file];
  } else {
    sourceFiles = await findAllRulespecFiles();
    if (sourceFiles.length === 0) {
      console.error(
        'No rulespec files found. Run "rulespec init --domain <name>" to create one.',
      );
      process.exit(1);
    }
  }

  for (const f of sourceFiles) {
    const specFile = await parseRulespecFile(f);
    const md = emitRulesMd(specFile, { includeExamples });

    const targetDir = overrideBase
      ? resolve(overrideBase, emitDirName(specFile))
      : dirname(f);
    await mkdir(targetDir, { recursive: true });

    const targetPath = resolve(targetDir, "SKILL.md");
    await writeFile(targetPath, md, "utf-8");
    console.log(`Emitted ${targetPath}`);
  }
}

async function scanSkillsDir(baseDir: string, found: Set<string>): Promise<void> {
  let entries: string[];
  try {
    entries = await readdir(baseDir);
  } catch {
    return;
  }
  for (const d of entries) {
    const sub = join(baseDir, d);
    try {
      const s = await stat(sub);
      if (!s.isDirectory()) continue;
    } catch {
      continue;
    }
    const p = join(sub, "rulespec.yaml");
    if (existsSync(p)) found.add(p);
  }
}

async function findAllRulespecFiles(): Promise<string[]> {
  const found = new Set<string>();
  const { project, global } = knownAgentDirs();

  // Default + every known agent's project skills dir
  await scanSkillsDir("skills", found);
  for (const dir of project) await scanSkillsDir(dir, found);

  // Every known agent's global skills dir
  for (const dir of global) await scanSkillsDir(dir, found);

  // Legacy: *.rulespec.yaml at cwd
  try {
    const entries = await readdir(".");
    for (const f of entries) {
      if (f.endsWith(".rulespec.yaml")) found.add(f);
    }
  } catch {}

  return [...found];
}
