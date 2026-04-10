---
name: rulespec
description: >
  Define, manage, and compile business rules as structured YAML data into LLM-ready prompts and agent-loadable SKILL.md files.
  Use when the user wants to create business rules, define policies, set guardrails, enforce constraints, add compliance rules,
  manage refund policies, escalation rules, approval thresholds, SLA requirements, content moderation rules, or any operational
  policy an AI agent should follow. Also use when the user says "add a rule", "create a policy", "set a constraint",
  "define guardrails", or asks about rulespec, rulespec.yaml, or business rule management.
---

# rulespec

rulespec is a CLI tool and standard format for expressing business rules as structured data. Rules are written in plain language by domain experts, stored in `rulespec.yaml`, and compiled into SKILL.md files that agents load directly.

**IMPORTANT: Always use the `rulespec` CLI to create, modify, and compile rules. Never edit `rulespec.yaml` or emitted SKILL.md files directly.** The CLI validates schema, enforces constraints, and keeps compiled prompts in sync. Direct edits bypass validation and will be overwritten on next compile/emit.

All commands use `npx rulespec` — no global install needed. npx downloads and runs it automatically.

## File format

```yaml
schema: rulespec/v1
domain: "your domain here"

sources:                              # optional — what data the rules operate on
  - id: source-name
    type: document | api | database | message | structured
    format: pdf | json | csv          # optional
    description: "What this source is"
    schema:                           # optional — shape of the data
      field: type

rules:
  - id: rule-id                       # kebab-case, unique
    rule: "The business rule in plain language"
    context: "When this rule applies"
    intent: enforce | inform | suggest

examples:                             # optional — end-to-end golden standards
  - description: "What this example tests"
    input: { ... }
    output: { ... }
```

### Intent levels

- `enforce` — mandatory. Agent must follow this rule. Compiles to directive language.
- `inform` — guidance. Agent should be aware. Compiles to neutral language.
- `suggest` — recommendation. Agent may consider. Compiles to soft language.

## CLI commands

```bash
rulespec init                         # Create a rulespec.yaml with an example rule
rulespec add --id <id> --rule <text> --context <text> --intent <enforce|inform|suggest>
rulespec remove <id>                  # Remove a rule by id
rulespec list                         # List all rules in a table
rulespec compile [id]                 # Compile rules into markdown prompts
rulespec validate                     # Check the file against the schema
rulespec emit                         # Generate skills/{domain}/SKILL.md for agents
rulespec emit --include-examples true # Include examples in the emitted SKILL.md
rulespec emit --outdir <path>         # Custom output directory (default: skills)
```

All commands accept `--file <path>` to specify a different file (default: `rulespec.yaml`).

## Workflow

1. `rulespec init` to create the file
2. Add rules with `rulespec add`
3. `rulespec validate` to check for errors
4. `rulespec compile` to preview the compiled prompts
5. `rulespec emit` to generate `skills/{domain}/SKILL.md` for agent consumption

## Output

`rulespec emit` generates a SKILL.md file with YAML frontmatter in the skills directory:

```
skills/
  invoice-processing/
    SKILL.md
  customer-support/
    SKILL.md
```

The emitted SKILL.md uses intent tags (`[enforce]`, `[inform]`, `[suggest]`) so the agent knows how strictly to treat each rule. Rules marked `[enforce]` should always be followed. `[inform]` provides guidance. `[suggest]` is optional.

## Key principles

- Always use the CLI — never edit rulespec.yaml or SKILL.md files directly
- One rule, one change — editing a rule only affects that rule's compiled output
- Business people own rules (plain language), engineers own compilation strategy
- Examples are for local evaluation — they contain real data and are excluded from SKILL.md by default
- Sources describe what data the rules operate on, making the spec self-contained

Built by the team behind [Clawnify](https://www.clawnify.com).
