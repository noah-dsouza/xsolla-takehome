import { describe, expect, it } from "vitest";
import { changedFiles } from "../src/git.js";

// Covers git.ts fix so a bad repo path throws a clear and readable error 
// Instead of a raw execFileSync stack trace how it originally was
describe("changedFiles", () => {
  it("throws a clear error when the path is not a git repository", () => {
    expect(() => changedFiles("/tmp", "main")).toThrow(/Failed to compute changed files/);
  });
});