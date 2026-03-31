# rulekit

*Once upon a time, business rules lived in the heads of domain experts. Then they were written in Word documents no one read. Then they were copy-pasted into LLM prompts by engineers who half-understood them, broke when anyone iterated, and drifted from reality within weeks. One day someone said: what if business rules were data, and prompts were compiled, not written? This repo is that idea. -@pallaoro, March 2026*

The idea: business rules change constantly. Prompts shouldn't be hand-edited every time a policy updates. **rulekit** is a standard format for expressing business rules as structured data, and a compiler that turns them into LLM-ready prompts. You change the rule, recompile, and only that prompt changes. Everything else stays untouched. The rules are owned by business people. The prompt strategy is owned by engineers. They version independently.

## How it works

A rulekit file is deliberately simple. Business rules are data, not prose buried in a system prompt:

```yaml
# rulekit.yaml
schema: rulekit/v1
domain: "e-commerce customer support"

rules:
  - id: refund-window
    rule: "Refunds are allowed within 30 days of purchase for unused items"
    context: "When a customer asks about returns or refunds"
    intent: enforce

  - id: greeting-tone
    rule: "Always greet the customer by first name in a warm, professional tone"
    context: "Beginning of every conversation"
    intent: inform

  - id: escalation
    rule: "Escalate to a human agent after 3 failed resolution attempts"
    context: "When automated support cannot resolve the issue"
    intent: enforce
```

Each rule has exactly four fields:

- **`id`** — unique identifier. This is how you reference, update, and track a rule.
- **`rule`** — the business rule in plain language. Written by a human who knows the domain. Sacred.
- **`context`** — when this rule applies. Guides the compiler on scoping.
- **`intent`** — `enforce`, `inform`, or `suggest`. Shapes how strict the compiled prompt is.

Then you compile:

```bash
rulekit compile
```

That's it. Out comes a prompt (or set of prompts) ready to inject into your LLM calls. Change one rule, recompile, only that rule's prompt output changes.

## Quick start

```bash
# 1. Install
npm install -g rulekit

# 2. Initialize a rulekit file in your project
rulekit init

# 3. Add your first rule
rulekit add --id "refund-window" \
  --rule "Refunds allowed within 30 days for unused items" \
  --context "Customer asks about returns" \
  --intent enforce

# 4. Compile rules into prompts
rulekit compile
```

## CLI commands

```
rulekit init          — create a rulekit.yaml in the current directory
rulekit add           — add a new rule
rulekit remove <id>   — remove a rule by id
rulekit edit <id>     — modify an existing rule
rulekit list          — list all rules
rulekit compile       — compile all rules into prompts
rulekit compile <id>  — compile a single rule
rulekit validate      — check your rulekit file against the schema
rulekit diff          — show what changed (rule and prompt delta)
```

## Design choices

- **Format first, tooling second.** rulekit is a schema, not a framework. The YAML file is the product. The CLI is convenience. You could hand-edit the file and pipe it through anything.
- **One rule, one change.** Editing a rule only affects that rule's compiled prompt. No cascading rewrites across your entire prompt. This makes iteration safe and diffs reviewable.
- **Intent shapes output.** `enforce` produces strict, directive prompt language. `inform` produces softer guidance. `suggest` produces optional recommendations. Same rule, different prompt weight — controlled by one field.
- **Business people own rules, engineers own strategy.** The compilation step is where prompt engineering lives. Rules are plain language. The two concerns never bleed into each other.
- **Self-contained.** One file, one schema, no infrastructure. Works with any LLM, any framework, any language. rulekit compiles to text — what you do with that text is up to you.

## Why not just edit prompts directly?

You can. Most people do. It works until:

- A policy changes and you update 3 of 7 places it appears in your prompt
- Two teams edit the same system prompt and one overwrites the other
- You can't tell which business rule a paragraph of prompt text corresponds to
- You want to A/B test one rule change without risking the rest
- An auditor asks "where in our AI system is the refund policy enforced?"

rulekit makes business rules traceable, diffable, and independently versionable. `git blame` tells you who changed a rule and when. `rulekit diff` tells you exactly how the prompt changed.

## License

MIT
