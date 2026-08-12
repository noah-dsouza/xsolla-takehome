# Submission

## What did you investigate first, and why?

I started with README.md to understand the intended CLI and MCP usage then
read the code in order of dependencies i.e core.ts first, since both adapters route
through it, then cli.ts and mcp-server.ts, then the individual modules
(git.ts, validation.ts, report.ts) and finally the existing test file to
see what was already covered. I read core.ts first since it's the shared
orchestration layer so understanding it made it much faster to evaluate
whether each adapter was using it correctly.

## What did you choose to implement or fix?

1. I fixed a broken MCP tool contract: the Zod input schema declared
   `repo_path`, but the handler read `input.repoPath` meaning `repositoryPath` was silently
   `undefined` for any real MCP client call which broke downstream in git.ts.
   (`src/mcp-server.ts`)

2. I fixed validation failure handling: a failing validation command (e.g.
   `npm test` failing) previously rejected the promise and crashed the
   entire review. Now resolves with `status: "failed"` so the failure
   shows up in the report instead of crashing the tool. (`src/validation.ts`)
3. I added error handling around git calls: a bad repo path or missing
   base ref previously threw a raw `execFileSync` stack trace. Now it
   throws a clear wrapped error message describing the likely cause.
   (`src/git.ts`)
4. I made the CLI reject unsupported `--format` values instead of silently
   accepting and ignoring them since only markdown output is implemented.
   (`src/cli.ts`)
5. I added a couple tests covering fixes 2 and 3. (`test/validation.test.ts`,
   `test/git.test.ts`)

## What did you intentionally not do?

I didn't address the lack of path/command validation before running git
or validation commands, the use of `exec` instead of `execFile` in
validation.ts (even though its a real injection concern given arbitrary validation
commands), the lack of a timeout on validation commands or the unused `"untracked"` status in the
`ChangedFile` type. All are listed under "known limitations" below. I did this with the intention of
prioritizing fixes that were high impact, safe/ fast to verify within the time
limit and directly affected whether the tool behaved as it should. 

## Interface decision

- Decision: Hybrid
- Primary user and execution environment:
  Consider two real consumers existing today:
  a dev running the CLI locally against a checked out repo and an AI
  coding agent using the MCP tool in a CI-like environment. Both go through the same core.ts
  orchestration so the tool was already hybrid at its core, the MCP path just wasn't functional before my fix.
- Trust boundary and allowed capabilities:
    Consider a human running the CLI is choosing their own repo path and validation commands interactively to reduce their risk. An MCP client may pass a repo path and validation command autonomously without a human reviewing it first causing a greater risk since validation.ts shells out via `exec` with no path or command validation. I flagged this gap instead  closing it considering he time limit.
- Reliability, discoverability, latency/context, and output tradeoffs:
  The CLI is more discoverable for humans due to usage message and `--flag`
  convention, but the MCP schema is what an agent actually reads to understand the contract so in my openion, the schema/handler consistency matters more for MCP callers than doc does. Markdown report output works for a human
  reading a file but could be too large in an agent's context window meaning a future iteration might want a compact/JSON summary mode for MCP callers. 
- How supported interfaces remain consistent:
  Both adapters call the same `reviewRepository` in core.ts so the behavior (what counts as a changed
  file and what a failed validation looks like) is guaranteed consistent by construction. My fixes live in the shared core code so both interfaces benefit automatically rather than needing to be duplicated.
- Evidence that would change this decision:'
  If usage data showed the MCP path was rarely or never invoked, I'd de-prioritize it and go CLI-first.
  If most usage came from agent orchestration and humans mainly wanted a quick JSON summary rather than a saved Markdown file, I'd lean towards MCP-first and treat the CLI as a thin debugging wrapper.

## How did you use an AI coding agent?

I used Claude throughout to help investigate the codebase, explain what
each file did, propose specific fixes, and review my edits before I
committed them, checking each change with `npm run typecheck` and
`npm test` before moving to the next.

## Where did you check, correct, or reject an AI suggestion? (required)

While adding the --format validation check to cli.ts, I caught a duplicated block of code outside the main() function that would have caused a compilation error. I verified the code against the expected structure, corrected the issue and ran typecheck before committing to make sure the final implementation was valid.

## Commands used to verify the result, with outcomes

- `npm run typecheck` — passed after every change, no errors
- `npm test` — 4/4 tests passing (1 original + 3 added)
- `npm run inspector -- review --repo . --format markdown` — ran
  successfully, wrote `review-report.md`
- `npm run inspector -- review --repo . --format json` — correctly
  rejected with "Unsupported format \"json\". Only \"markdown\" is
  currently supported."
- `npm run inspector -- review --repo . --validate "exit 1"` — did not
  crash; `review-report.md` correctly showed the validation as failed
  with its output captured

## A blocker you hit and how you approached it

I initially made a mistake merging the `--format` check into `cli.ts` and ended
up with a duplicated block of code outside the `main()`function. 
I resolved it by comparing my file line-by-line against the
intended structure, removing the duplicate and re-running `npm run
typecheck` to confirm the file compiled cleanly before moving on.

## Known limitations and the next three things you would do

1. Add a timeout on validation commands — currently unbounded and could
   hang indefinitely.
2. Switch `validation.ts` from `exec` (shell) to `execFile` to reduce
   injection risk since validation commands could
   originate from an MCP client rather than a human typing them.
3. Add path/repo validation before running git to reject a non-existent or
   non-git path early with a clear message and decide whether to
   implement `--format json` or remove the flag since it's currently
   documented but unimplemented.

## Approximate focused-work time

- Start: 11:22
- Finish: 12:02 (focus time)