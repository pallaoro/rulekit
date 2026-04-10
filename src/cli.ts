#!/usr/bin/env node

import { init } from "./commands/init.js";
import { add } from "./commands/add.js";
import { remove } from "./commands/remove.js";
import { list } from "./commands/list.js";
import { compile } from "./commands/compile.js";
import { validateCmd } from "./commands/validate.js";
import { emit } from "./commands/emit.js";

function parseFlags(args: string[]): Record<string, string> {
  const flags: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--") && i + 1 < args.length) {
      flags[args[i].slice(2)] = args[i + 1];
      i++;
    }
  }
  return flags;
}

function printHelp(): void {
  console.log(`rulekit — business rules as structured data

Usage:
  rulekit <command> [options]

Commands:
  init              Create a rulekit.yaml in the current directory
  add               Add a new rule
  remove <id>       Remove a rule by id
  list              List all rules
  compile [id]      Regenerate prompts and print markdown to stdout
  validate          Validate the rulekit file
  emit              Generate rules/{domain}/RULES.md for agent consumption

Options:
  --file <path>     Path to rulekit file (default: rulekit.yaml)
  --help            Show this help message

Add options:
  --id <id>         Rule id (kebab-case)
  --rule <text>     The business rule
  --context <text>  When the rule applies
  --intent <type>   enforce, inform, or suggest

Emit options:
  --outdir <path>   Output directory (default: rules)
  --include-examples true  Include examples in RULES.md (default: false)`);
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
  const file = flags.file ?? "rulekit.yaml";

  switch (command) {
    case "init":
      await init(file);
      break;
    case "add":
      await add(file, flags);
      break;
    case "remove":
      if (!rest[0] || rest[0].startsWith("--")) {
        console.error("Usage: rulekit remove <id>");
        process.exit(1);
      }
      await remove(file, rest[0]);
      break;
    case "list":
      await list(file);
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
