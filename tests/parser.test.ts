import { describe, it, expect } from "vitest";
import { parseRulespecFile } from "../src/parser.js";
import { resolve } from "node:path";

const fixture = (name: string) => resolve("fixtures", name);

describe("parseRulespecFile", () => {
  it("parses a valid rulespec file", async () => {
    const result = await parseRulespecFile(fixture("valid.yaml"));
    expect(result.schema).toBe("rulespec/v1");
    expect(result.domain).toBe("e-commerce customer support");
    expect(result.rules).toHaveLength(3);
    expect(result.rules[0].id).toBe("refund-window");
  });

  it("throws on missing file with helpful message", async () => {
    await expect(parseRulespecFile("nonexistent.yaml")).rejects.toThrow(
      /File not found.*rulespec init/s,
    );
  });

  it("throws on invalid file with validation errors", async () => {
    await expect(parseRulespecFile(fixture("invalid.yaml"))).rejects.toThrow(
      /Invalid rulespec file/,
    );
  });
});
