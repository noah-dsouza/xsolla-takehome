import { exec } from "node:child_process";
import type { ValidationResult } from "./types.js";

export function runValidation(command: string, cwd: string): Promise<ValidationResult> {
  return new Promise((resolve, reject) => {
    exec(command, { cwd }, (error, stdout, stderr) => {
      if (error) {
        // Failed validations are normal and we want them reported back instead of crashing the entire review
        // In og code, any errors/ failures  rejected the promise and killed core.ts/ the entire review. 
        // Want reports of failed validations reported back to user to fix and re run to confirm ced fix. 
        resolve({ command, status: "failed", output: stdout || stderr || error.message });
        return;
      }
      resolve({ command, status: "passed", output: stdout || stderr });
    });
  });
}

export async function runValidations(commands: string[], cwd: string): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];
  for (const command of commands) {
    results.push(await runValidation(command, cwd));
  }
  return results;
}