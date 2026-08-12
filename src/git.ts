import { execFileSync } from "node:child_process";
import type { ChangedFile } from "./types.js";

function git(repositoryPath: string, args: string[]): string {
  return execFileSync("git", args, {
    cwd: repositoryPath,
    encoding: "utf8",
  }).trim();
}

export function changedFiles(repositoryPath: string, baseRef?: string): ChangedFile[] {
  const base = baseRef ?? "main";
  let output: string;
  try {
    output = git(repositoryPath, ["diff", "--name-status", `${base}...HEAD`]);
  } catch (error) {
    // Throw a more descriptive error msg instead of a raw execFileSync error that is not helpful to the user/ is only stack trace
    // most likeley causes could include bad repo path, not a git repo or baseref dne locally 
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Failed to compute changed files for "${repositoryPath}" against base "${base}": ${reason}`,
    );
  }

  return output
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [code, ...pathParts] = line.split("\t");
      const status = code === "A" ? "added" : code === "D" ? "deleted" : "modified";
      return { path: pathParts.join("\t"), status };
    });
}