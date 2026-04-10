import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { addRule, removeRule } from "../src/writer.js";
import { parseRulespecFile } from "../src/parser.js";
import { copyFile, unlink } from "node:fs/promises";
import { resolve } from "node:path";

const TMP = resolve("fixtures", "_tmp.yaml");
const SOURCE = resolve("fixtures", "valid.yaml");

beforeEach(async () => {
  await copyFile(SOURCE, TMP);
});

afterEach(async () => {
  try {
    await unlink(TMP);
  } catch {}
});

describe("addRule", () => {
  it("appends a rule to the file", async () => {
    await addRule(TMP, {
      id: "new-rule",
      rule: "A brand new rule",
      context: "Always",
      intent: "suggest",
      prompt: "",
    });

    const file = await parseRulespecFile(TMP);
    expect(file.rules).toHaveLength(4);
    expect(file.rules[3].id).toBe("new-rule");
  });

  it("auto-generates prompt on add", async () => {
    await addRule(TMP, {
      id: "new-rule",
      rule: "A brand new rule",
      context: "Always",
      intent: "enforce",
      prompt: "",
    });

    const file = await parseRulespecFile(TMP);
    const added = file.rules.find((r) => r.id === "new-rule")!;
    expect(added.prompt).toContain("### New Rule");
    expect(added.prompt).toContain("**You must follow this rule.**");
    expect(added.prompt).toContain("A brand new rule.");
  });

  it("throws on duplicate id", async () => {
    await expect(
      addRule(TMP, {
        id: "refund-window",
        rule: "Duplicate",
        context: "Always",
        intent: "inform",
        prompt: "",
      }),
    ).rejects.toThrow(/already exists/);
  });
});

describe("removeRule", () => {
  it("removes a rule by id", async () => {
    await removeRule(TMP, "greeting-tone");
    const file = await parseRulespecFile(TMP);
    expect(file.rules).toHaveLength(2);
    expect(file.rules.every((r) => r.id !== "greeting-tone")).toBe(true);
  });

  it("throws on non-existent id", async () => {
    await expect(removeRule(TMP, "no-such-rule")).rejects.toThrow(/not found/);
  });
});
