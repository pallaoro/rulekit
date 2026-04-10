import { describe, it, expect } from "vitest";
import { parseRulekitFile } from "../src/parser.js";
import { resolve } from "node:path";

const fixture = (name: string) => resolve("fixtures", name);

describe("parseRulekitFile", () => {
  it("parses a valid rulekit file", async () => {
    const result = await parseRulekitFile(fixture("valid.yaml"));
    expect(result.schema).toBe("rulekit/v1");
    expect(result.domain).toBe("e-commerce customer support");
    expect(result.rules).toHaveLength(3);
    expect(result.rules[0].id).toBe("refund-window");
  });

  it("throws on missing file with helpful message", async () => {
    await expect(parseRulekitFile("nonexistent.yaml")).rejects.toThrow(
      /File not found.*rulekit init/s,
    );
  });

  it("throws on invalid file with validation errors", async () => {
    await expect(parseRulekitFile(fixture("invalid.yaml"))).rejects.toThrow(
      /Invalid rulekit file/,
    );
  });
});
