# rulekit

*Once upon a time, business rules lived in the heads of domain experts. Then they were written in Word documents no one read. Then they were copy-pasted into LLM prompts by engineers who half-understood them, broke when anyone iterated, and drifted from reality within weeks. One day someone said: what if business rules were data, and prompts were compiled, not written? This repo is that idea. -@pallaoro, March 2026*

The idea: business rules change constantly. Prompts shouldn't be hand-edited every time a policy updates. **rulekit** is a standard format for expressing business rules as structured data, and a compiler that turns them into LLM-ready prompts — or RULES.md files that AI agents load directly.

You change the rule, recompile, and only that prompt changes. Everything else stays untouched. The rules are owned by business people. The prompt strategy is owned by engineers. They version independently.

## How it works

A rulekit file is deliberately simple. Business rules are data, not prose buried in a system prompt:

```yaml
# rulekit.yaml
schema: rulekit/v1
domain: "invoice processing"

sources:
  - id: invoice
    type: document
    format: pdf
    description: "Incoming vendor invoice"
    schema:
      number: string
      vendor: string
      line_items:
        - description: string
          quantity: number
          unit_price: number
          currency: string

  - id: vendor-lookup
    type: api
    format: json
    description: "ERP vendor lookup"

rules:
  - id: duplicate-check
    rule: "Reject invoices with duplicate invoice numbers"
    context: "Before processing any invoice"
    intent: enforce

  - id: approval-threshold
    rule: "Invoices over $5000 require manager approval"
    context: "After extraction, before posting"
    intent: enforce

  - id: greeting
    rule: "Address the submitter by first name in confirmation messages"
    context: "After processing decision"
    intent: inform

examples:
  - description: "Foreign currency invoice requiring approval"
    input:
      invoice:
        number: "INV-1001"
        vendor: "Acme GmbH"
        line_items:
          - description: "Consulting Q1"
            quantity: 1
            unit_price: 7200
            currency: "EUR"
    output:
      action: "require-approval"
      vendor: "Acme GmbH"
      converted: { amount: 7850, currency: "USD" }
      approver: "finance-mgr"

  - description: "Duplicate invoice rejection"
    input:
      invoice: { number: "INV-0999", vendor: "Local Supply" }
      existing_invoices: ["INV-0999"]
    output:
      action: "reject"
      reason: "duplicate"
```

### Fields

**Rules** have exactly four fields:

- **`id`** — unique identifier. This is how you reference, update, and track a rule.
- **`rule`** — the business rule in plain language. Written by a human who knows the domain. Sacred.
- **`context`** — when this rule applies. Guides the compiler on scoping.
- **`intent`** — `enforce`, `inform`, or `suggest`. Shapes how strict the compiled prompt is.

**Sources** (optional) describe what data the rules operate on:

- **`id`** — unique identifier for the source.
- **`type`** — `document`, `api`, `database`, `message`, or `structured`.
- **`format`** — file format or data format (e.g. `pdf`, `json`).
- **`description`** — what this source is.
- **`schema`** — shape of the data (optional, freeform YAML).

**Examples** (optional) are end-to-end test cases — input/output pairs that define correct behavior:

- **`input`** — structured representation of the input data.
- **`output`** — the expected result.
- **`description`** — what this example tests.

Examples serve two purposes: they're the acceptance tests for evaluation, and they document expected behavior for humans reading the spec.

## Two outputs

rulekit compiles to two formats:

### 1. Compiled prompts (for injection into LLM calls)

```bash
rulekit compile
```

```markdown
## Rules

### Duplicate Check
**You must follow this rule.** Before processing any invoice: Reject invoices with duplicate invoice numbers.

### Approval Threshold
**You must follow this rule.** After extraction, before posting: Invoices over $5000 require manager approval.

### Greeting
After processing decision: Address the submitter by first name in confirmation messages.
```

### 2. RULES.md (for AI agents)

```bash
rulekit emit
```

Generates a `rules/{domain}/RULES.md` file that agents load directly — like AGENT.md for identity or TOOLS.md for capabilities, RULES.md is for business policy:

```
rules/
  invoice-processing/
    RULES.md
  customer-support/
    RULES.md
  compliance/
    RULES.md
```

Each RULES.md has YAML frontmatter for progressive disclosure (agents read name + description first, full rules only when relevant) and intent tags (`[enforce]`, `[inform]`, `[suggest]`) that tell the agent how strictly to treat each rule:

```markdown
---
name: invoice-processing
description: Business rules for invoice processing. 3 rules: Duplicate Check, Approval Threshold, Greeting.
type: rules
schema: rulekit/v1
---

## Sources

| Source | Type | Format | Description |
|--------|------|--------|-------------|
| invoice | document | pdf | Incoming vendor invoice |
| vendor-lookup | api | json | ERP vendor lookup |

## Rules

### Duplicate Check [enforce]
**You must follow this rule.** Before processing any invoice: Reject invoices with duplicate invoice numbers.

### Approval Threshold [enforce]
**You must follow this rule.** After extraction, before posting: Invoices over $5000 require manager approval.

### Greeting [inform]
After processing decision: Address the submitter by first name in confirmation messages.
```

## The `rules/` directory convention

Like `skills/` for SKILL.md, rules live in a `rules/` directory — one subdirectory per domain:

```
workspace/
  AGENT.md              # identity (always loaded)
  TOOLS.md              # available tools (always loaded)
  rules/                # business rules
    invoice-processing/
      RULES.md          # agent-readable rules
    customer-support/
      RULES.md
    compliance/
      RULES.md
  skills/               # capabilities (loaded on demand)
    pdf-processing/
      SKILL.md
```

### How agents load rules

**RULES.md sits at the same level as AGENT.md and TOOLS.md** — it's always-active context, not conditionally loaded expertise. The key difference from SKILL.md:

- **Skills** are loaded on demand when the agent decides they're relevant.
- **Rules marked `[enforce]`** are always loaded. You don't conditionally load compliance rules.
- **Rules marked `[inform]` or `[suggest]`** can be progressively loaded based on task relevance.

### Keeping examples separate

Examples contain real business data. They never go into RULES.md by default — they stay in the rulekit.yaml source file for local evaluation only:

```
rulekit.yaml            # source of truth (rules + sources + examples)
rules/
  invoice-processing/
    RULES.md            # emitted for agent consumption (no examples)
```

To include examples in the emitted RULES.md (e.g. for demonstration purposes):

```bash
rulekit emit --include-examples true
```

## Quick start

```bash
# 1. Install
npm install -g rulekit

# 2. Initialize a rulekit file
rulekit init

# 3. Add rules
rulekit add --id "refund-window" \
  --rule "Refunds allowed within 30 days for unused items" \
  --context "Customer asks about returns" \
  --intent enforce

# 4. Compile to prompts
rulekit compile

# 5. Emit RULES.md for agents
rulekit emit
```

## CLI commands

```
rulekit init                        Create a rulekit.yaml in the current directory
rulekit add                         Add a new rule
rulekit remove <id>                 Remove a rule by id
rulekit list                        List all rules
rulekit compile [id]                Regenerate prompts and print markdown to stdout
rulekit validate                    Validate the rulekit file
rulekit emit                        Generate rules/{domain}/RULES.md for agents

Options:
  --file <path>                     Path to rulekit file (default: rulekit.yaml)
  --outdir <path>                   Output directory for emit (default: rules)
  --include-examples true           Include examples in emitted RULES.md
```

## Design choices

- **Format first, tooling second.** rulekit is a schema, not a framework. The YAML file is the product. The CLI is convenience. You could hand-edit the file and pipe it through anything.
- **One rule, one change.** Editing a rule only affects that rule's compiled prompt. No cascading rewrites across your entire prompt. This makes iteration safe and diffs reviewable.
- **Intent shapes output.** `enforce` produces strict, directive prompt language. `inform` produces softer guidance. `suggest` produces optional recommendations. Same rule, different prompt weight — controlled by one field.
- **Business people own rules, engineers own strategy.** The compilation step is where prompt engineering lives. Rules are plain language. The two concerns never bleed into each other.
- **Sources describe, examples prove.** Sources define what data the rules operate on. Examples define what correct looks like. Together they form a complete specification that can be evaluated automatically.
- **Schema up, data stays down.** The rulekit spec (rules + source schemas) is safe to share with LLMs, vendors, auditors. Examples contain real data and stay local for evaluation. RULES.md excludes examples by default.

## Why not just edit prompts directly?

You can. Most people do. It works until:

- A policy changes and you update 3 of 7 places it appears in your prompt
- Two teams edit the same system prompt and one overwrites the other
- You can't tell which business rule a paragraph of prompt text corresponds to
- You want to A/B test one rule change without risking the rest
- An auditor asks "where in our AI system is the refund policy enforced?"
- You need to prove your AI agent follows business policy before going live

rulekit makes business rules traceable, diffable, and independently versionable. `git blame` tells you who changed a rule and when. `rulekit diff` tells you exactly how the prompt changed. Examples let you verify the rules actually work.

## License

MIT
