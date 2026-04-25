#!/usr/bin/env node

import { init } from "./commands/init.js";
import { add } from "./commands/add.js";
import { edit } from "./commands/edit.js";
import { remove } from "./commands/remove.js";
import { list } from "./commands/list.js";
import { compile } from "./commands/compile.js";
import { validateCmd } from "./commands/validate.js";
import { emit } from "./commands/emit.js";
import { setDomainCmd } from "./commands/set-domain.js";
import { addSourceCmd } from "./commands/add-source.js";
import { removeSourceCmd } from "./commands/remove-source.js";
import { addExampleCmd } from "./commands/add-example.js";
import { removeExampleCmd } from "./commands/remove-example.js";
import { replaceCmd } from "./commands/replace.js";
import { addRuleExampleCmd } from "./commands/add-rule-example.js";
import { removeRuleExampleCmd } from "./commands/remove-rule-example.js";

const SHORT_ALIASES: Record<string, string> = { a: "agent", g: "global" };
const BOOLEAN_FLAGS = new Set(["global"]);

function parseFlags(args: string[]): Record<string, string> {
  const flags: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    let key: string | null = null;
    if (arg.startsWith("--")) {
      key = arg.slice(2);
    } else if (arg.length === 2 && arg.startsWith("-")) {
      key = SHORT_ALIASES[arg.slice(1)] ?? arg.slice(1);
    }
    if (!key) continue;
    if (BOOLEAN_FLAGS.has(key)) {
      flags[key] = "true";
    } else if (i + 1 < args.length) {
      flags[key] = args[i + 1];
      i++;
    }
  }
  return flags;
}

import { readdirSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { knownAgentDirs } from "./agents.js";

function scanSkillsDir(baseDir: string, found: Set<string>): void {
  try {
    const entries = readdirSync(baseDir);
    for (const d of entries) {
      const sub = join(baseDir, d);
      try {
        if (!statSync(sub).isDirectory()) continue;
      } catch {
        continue;
      }
      const p = join(sub, "rulespec.yaml");
      if (existsSync(p)) found.add(p);
    }
  } catch {}
}

function findRulespecFiles(): string[] {
  const found = new Set<string>();
  const { project, global } = knownAgentDirs();

  // Default + every known agent's project skills dir
  scanSkillsDir("skills", found);
  for (const dir of project) scanSkillsDir(dir, found);

  // Every known agent's global skills dir
  for (const dir of global) scanSkillsDir(dir, found);

  // Legacy: *.rulespec.yaml at cwd
  try {
    for (const f of readdirSync(".")) {
      if (f.endsWith(".rulespec.yaml")) found.add(f);
    }
  } catch {}

  // Legacy: rulespec.yaml at cwd
  if (existsSync("rulespec.yaml")) found.add("rulespec.yaml");

  return [...found];
}

function resolveDefaultFile(): string {
  const files = findRulespecFiles();
  if (files.length === 1) return files[0];
  if (files.length > 1) {
    console.error(
      `Multiple rulespec files found: ${files.join(", ")}\nUse --file to specify which one.`,
    );
    process.exit(1);
  }
  return "rulespec.yaml"; // will fail with helpful "file not found" later
}

function printHelp(): void {
  console.log(`rulespec — business rules as structured data

Usage:
  rulespec <command> [options]

Commands:
  init                    Scaffold a skill folder for {domain} (--domain required)
  set-domain <domain>     Set the domain name
  add                     Add a new rule
  edit <id>               Modify an existing rule
  remove <id>             Remove a rule by id
  list                    List all rules
  add-source              Add a data source
  remove-source <id>      Remove a data source by id
  add-example             Add a global input/output example
  remove-example <index>  Remove an example by index (0-based)
  add-rule-example <id>   Add an example to a specific rule
  remove-rule-example <id> <index>  Remove an example from a rule
  compile [id]            Regenerate prompts and print markdown to stdout
  validate                Validate the rulespec file
  replace                 Find and replace text in rulespec.yaml (validates + recompiles)
  emit                    Compile rulespec.yaml sources to skills/{domain}/SKILL.md

Options:
  --file <path>           Path to rulespec file (auto-detected from skills/*/rulespec.yaml)
  --help                  Show this help message

Init options:
  --domain <name>         Domain name (required, used as folder name)
  -a, --agent <name>      Target agent (e.g. claude-code, cursor, openclaw)
                          Folder lands in that agent's skills dir instead of skills/
  -g, --global            Use the agent's user-global skills dir (~/.<agent>/skills)
                          Requires --agent

Rule options (add / edit):
  --id <id>               Rule id (kebab-case, required for add)
  --rule <text>           The business rule
  --context <text>        When the rule applies
  --intent <type>         enforce, inform, or suggest

Source options (add-source):
  --id <id>               Source id (kebab-case)
  --type <type>           document, api, database, message, or structured
  --description <text>    What this source is
  --format <fmt>          Data format (optional, e.g. pdf, json, csv)

Example options (add-example):
  --input <json>          Input data as JSON string
  --output <json>         Expected output as JSON string
  --note <text>           Context or comment for the example (optional)

Emit options:
  (no flags)              Writes SKILL.md right next to the discovered source
  -a, --agent <name>      Override: write to this agent's skills dir instead
  -g, --global            With --agent: use the agent's global skills dir
  --outdir <path>         Override: write to a custom directory
  --include-examples true Include examples in SKILL.md (default: false)

Replace options:
  --old <text>            Text to find
  --new <text>            Replacement text`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === "--help" || command === "-h") {
    printHelp();
    return;
  }

  const rest = args.slice(1);
  const flags = parseFlags(rest);
  const noAutoResolve = command === "init" || command === "emit";
  const file = flags.file ?? (noAutoResolve ? "rulespec.yaml" : resolveDefaultFile());

  switch (command) {
    case "init":
      await init(file, flags);
      break;
    case "set-domain":
      if (!rest[0] || rest[0].startsWith("--")) {
        console.error("Usage: rulespec set-domain <domain>");
        process.exit(1);
      }
      await setDomainCmd(file, rest[0]);
      break;
    case "add":
      await add(file, flags);
      break;
    case "edit":
      if (!rest[0] || rest[0].startsWith("--")) {
        console.error("Usage: rulespec edit <id> [--rule <text>] [--context <text>] [--intent <type>]");
        process.exit(1);
      }
      await edit(file, rest[0], flags);
      break;
    case "remove":
      if (!rest[0] || rest[0].startsWith("--")) {
        console.error("Usage: rulespec remove <id>");
        process.exit(1);
      }
      await remove(file, rest[0]);
      break;
    case "list":
      await list(file);
      break;
    case "add-source":
      await addSourceCmd(file, flags);
      break;
    case "remove-source":
      if (!rest[0] || rest[0].startsWith("--")) {
        console.error("Usage: rulespec remove-source <id>");
        process.exit(1);
      }
      await removeSourceCmd(file, rest[0]);
      break;
    case "add-example":
      await addExampleCmd(file, flags);
      break;
    case "remove-example":
      if (!rest[0] || rest[0].startsWith("--")) {
        console.error("Usage: rulespec remove-example <index>");
        process.exit(1);
      }
      await removeExampleCmd(file, rest[0]);
      break;
    case "add-rule-example":
      if (!rest[0] || rest[0].startsWith("--")) {
        console.error(
          'Usage: rulespec add-rule-example <rule-id> --input \'{"key":"val"}\' --output \'{"key":"val"}\'',
        );
        process.exit(1);
      }
      await addRuleExampleCmd(file, rest[0], flags);
      break;
    case "remove-rule-example": {
      const ruleId = rest[0];
      const exIdx = rest[1];
      if (!ruleId || ruleId.startsWith("--") || !exIdx) {
        console.error(
          "Usage: rulespec remove-rule-example <rule-id> <index>",
        );
        process.exit(1);
      }
      await removeRuleExampleCmd(file, ruleId, exIdx);
      break;
    }
    case "replace":
      await replaceCmd(file, flags);
      break;
    case "compile": {
      const ruleId = rest[0] && !rest[0].startsWith("--") ? rest[0] : undefined;
      await compile(file, ruleId);
      break;
    }
    case "validate":
      await validateCmd(file);
      break;
    case "emit":
      await emit(file, flags);
      break;
    default:
      console.error(`Unknown command: ${command}`);
      printHelp();
      process.exit(1);
  }
}

main().catch((err: Error) => {
  console.error(err.message);
  process.exit(1);
});
