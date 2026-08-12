import { describe, expect, it } from "vitest";
import { runValidation } from "../src/validation.js";

// Failing commands should resolve w/ failed status in report, not rejected + crashing entire review

describe("runValidation", () => {
  it("resolves with status 'failed' when the command exits non-zero, instead of throwing", async () => {
    const result = await runValidation("exit 1", process.cwd());
    expect(result.status).toBe("failed");
    expect(result.command).toBe("exit 1");
  });

  it("resolves with status 'passed' when the command succeeds", async () => {
    const result = await runValidation("echo hello", process.cwd());
    expect(result.status).toBe("passed");
    expect(result.output).toContain("hello");
  });
});