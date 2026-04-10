import { describe, it, expect } from "vitest";
import { compileRule, compileRules } from "../src/compiler.js";
import type { Rule, RulekitFile } from "../src/schema.js";

const makeRule = (overrides: Partial<Rule> = {}): Rule => ({
  id: "test-rule",
  rule: "Do the thing",
  context: "When something happens",
  intent: "inform",
  prompt: "",
  ...overrides,
});

const makeFile = (rules: Rule[]): RulekitFile => ({
  schema: "rulekit/v1",
  domain: "test",
  rules,
});

describe("compileRule", () => {
  it("converts kebab-case id to title case heading", () => {
    const result = compileRule(makeRule({ id: "refund-window" }));
    expect(result).toMatch(/^### Refund Window\n/);
  });

  it("adds enforce prefix", () => {
    const result = compileRule(makeRule({ intent: "enforce" }));
    expect(result).toContain("**You must follow this rule.**");
  });

  it("adds no prefix for inform", () => {
    const result = compileRule(makeRule({ intent: "inform" }));
    expect(result).not.toContain("**");
    expect(result).not.toContain("Consider");
  });

  it("adds suggest prefix", () => {
    const result = compileRule(makeRule({ intent: "suggest" }));
    expect(result).toContain("Consider the following:");
  });

  it("includes context and rule text", () => {
    const result = compileRule(
      makeRule({ context: "At checkout", rule: "Verify the total" }),
    );
    expect(result).toContain("At checkout: Verify the total.");
  });

  it("does not double trailing period", () => {
    const result = compileRule(makeRule({ rule: "Do the thing." }));
    expect(result).not.toContain("..");
    expect(result).toMatch(/Do the thing\.$/);
  });

  it("does not add period after exclamation", () => {
    const result = compileRule(makeRule({ rule: "Do it now!" }));
    expect(result).toMatch(/Do it now!$/);
  });

  it("does not add period after question mark", () => {
    const result = compileRule(makeRule({ rule: "Is this valid?" }));
    expect(result).toMatch(/Is this valid\?$/);
  });
});

describe("compileRules", () => {
  it("includes ## Rules header by default", () => {
    const result = compileRules(makeFile([makeRule()]));
    expect(result).toMatch(/^## Rules\n/);
  });

  it("omits header when includeHeader is false", () => {
    const result = compileRules(makeFile([makeRule()]), {
      includeHeader: false,
    });
    expect(result).not.toContain("## Rules");
    expect(result).toMatch(/^### /);
  });

  it("joins multiple rules with double newline", () => {
    const rules = [
      makeRule({ id: "rule-a" }),
      makeRule({ id: "rule-b" }),
    ];
    const result = compileRules(makeFile(rules), { includeHeader: false });
    expect(result).toContain("### Rule A\n");
    expect(result).toContain("\n\n### Rule B\n");
  });

  it("produces expected output for the README example", () => {
    const file: RulekitFile = {
      schema: "rulekit/v1",
      domain: "e-commerce customer support",
      rules: [
        {
          id: "refund-window",
          rule: "Refunds are allowed within 30 days of purchase for unused items",
          context: "When a customer asks about returns or refunds",
          intent: "enforce",
          prompt: "",
        },
        {
          id: "greeting-tone",
          rule: "Always greet the customer by first name in a warm, professional tone",
          context: "Beginning of every conversation",
          intent: "inform",
          prompt: "",
        },
      ],
    };

    const result = compileRules(file);
    expect(result).toContain("## Rules");
    expect(result).toContain("### Refund Window");
    expect(result).toContain("**You must follow this rule.**");
    expect(result).toContain("### Greeting Tone");
    expect(result).not.toContain("Consider");
  });
});
