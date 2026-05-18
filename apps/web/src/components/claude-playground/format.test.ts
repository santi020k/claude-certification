import { describe, it, expect } from "vitest";
import { formatModel } from "./format";

describe("formatModel", () => {
  it("should format standard claude models correctly", () => {
    expect(formatModel("claude-sonnet-4-0")).toBe("Claude Sonnet 4");
    expect(formatModel("claude-opus-4-0")).toBe("Claude Opus 4");
    expect(formatModel("claude-haiku-4-5")).toBe("Claude Haiku 4.5");
  });

  it("should format models with date suffixes", () => {
    expect(formatModel("claude-3-7-sonnet-20270222")).toBe("Claude 3.7 Sonnet");
    expect(formatModel("claude-3-5-haiku-20241022")).toBe("Claude 3.5 Haiku");
  });

  it("should format generic non-claude names or already formatted names", () => {
    expect(formatModel("Claude Sonnet")).toBe("Claude Sonnet");
    expect(formatModel("gpt-4")).toBe("Claude Gpt 4");
  });
});
