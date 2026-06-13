---
name: context-guardian
description: "Keep Claude Code sessions sharp by managing the context window proactively to prevent context rot (degraded quality as context fills up). Use this skill at the START of every coding session and throughout it. Trigger this whenever the user mentions context, tokens, the session feeling off, Claude forgetting earlier decisions, repeating itself, contradicting earlier work, /compact, /clear, compacting, long sessions, or whenever a session has been running for a while. Apply the 40 percent rule automatically — when context usage crosses ~40 percent, proactively compact or reset rather than waiting for auto-compaction. Also use this skill any time you are about to start a new, unrelated task within an existing session."
---

# Context Guardian

A skill for keeping Claude Code sessions accurate over long sessions by managing the context window before quality degrades.

## The problem: context rot

As a session's context window fills up, model quality degrades. Attention gets spread across more tokens, and older, irrelevant material (stale file contents, dead-end debugging, completed sub-tasks) starts competing with the task that actually matters now. Symptoms, in rough order of severity:

- Slightly inconsistent answers to the same question asked at different points
- Referencing files or structures that were already changed or deleted
- Re-asking things already answered; re-suggesting approaches already ruled out
- Producing code that breaks patterns established earlier in the session
- In severe cases: confidently editing a file Claude itself deleted earlier

The key mental model: **context is active working memory, not an archive.** Carrying the wrong context forward for too long is what wrecks most long sessions — not the model being weak.

## The core rule: act at 40%, not at the limit

Auto-compaction (the automatic summarization that fires when the window is nearly full) is unreliable, because it triggers exactly when the model is at its lowest point — context rot is worst near the limit. By then the summary it produces is itself low quality.

**So act early. When context usage crosses ~40%, take a deliberate action instead of just continuing.** A clean summary written while the model can still think clearly is worth far more than 40 messages of messy context.

### How to check context usage

Run `/context` in Claude Code to see current window usage as a percentage and token count. Check it:
- At the start of a session (to confirm a clean slate)
- After finishing any sizeable task (refactor, feature, debugging round)
- Whenever the session "feels off" per the symptoms above
- Periodically during long sessions — don't wait to be surprised

## The decision: which action to take at 40%

After any turn, the right move depends on whether the *current* context is still load-bearing for what comes next. Pick one:

| Situation | Action |
|---|---|
| Starting a genuinely **unrelated** task | `/clear` — wipe context entirely, fresh slate |
| Continuing the **same** task but context is bloated | `/compact <instructions>` — summarize and keep going |
| Doing a **related** task that needs *some* prior context (e.g. writing docs for a feature just built) | `/compact focus on <what to keep>` |
| Need to verify something or read another codebase as a side-quest | spin up a **subagent** so its file-reads and dead ends stay out of your main context |
| Want to undo back to a known-good point | `/rewind` (or Esc+Esc) and pick a checkpoint |

The single most useful habit: **new task → new session.** When you start a new task, `/clear` (or start a fresh session) unless you specifically need the prior context.

## How to compact well

Don't run a bare `/compact` and hope. Steer it so it keeps what matters and drops the noise:

```
/compact focus on the auth refactor; keep the list of modified files and the test command; drop the test-debugging tangent
```

Good things to explicitly preserve in the instruction: the current task and goal, the list of files modified, exact test/build/run commands, key decisions and constraints, and anything that will be needed for the *next* step. Things safe to drop: resolved debugging detours, large file dumps you no longer need, and chit-chat.

After compacting, send one verification message — "Summarize where we are and what we're working on next" — to confirm nothing critical was lost before continuing.

## Persisting preferences via CLAUDE.md

To make good compaction automatic, add an instruction to the project's `CLAUDE.md` so it survives every summarization. Suggested block:

```markdown
## Context management
- When compacting, always preserve: the current task/goal, the full list of
  modified files, and any test/build/run commands.
- Prefer proactive /compact over relying on auto-compaction.
```

`CLAUDE.md` itself is durable working memory — treat it like a README for Claude. At the end of a major session, update it with what changed and what it means for future work, so future sessions start informed instead of re-deriving everything.

## Token-economy habits (use less context in the first place)

The cheapest context to manage is the context you never spend. Throughout a session:

- **Scope file reads.** Read the specific function/section you need, not entire large files. Use search to locate the relevant lines first.
- **Keep tool output lean.** Long shell output, verbose logs, and big payloads eat the window fast. Pipe through `head`, `grep`, or summarize rather than dumping raw.
- **Push noisy or exploratory work into subagents.** Verifying an implementation against a spec, or reading an unfamiliar codebase to extract one pattern — let the subagent absorb the noise and return only the result.
- **Use task/plan files as anchors.** For a complex task, write a short `.task` or `.plan` file (task, constraints, acceptance criteria) before starting. It survives compaction and re-grounds the session cheaply.
- **Use `/btw` for throwaway questions** that don't need to stay in context.
- **`/clear` between unrelated tasks** rather than letting them accumulate.

## Quick checklist

1. Start of session → `/context` to confirm a clean slate; write a plan/task file for anything complex.
2. During work → keep reads scoped and tool output lean; route noisy side-quests to subagents.
3. After each task → check `/context`. Crossed ~40%? Act now, don't continue blindly.
4. Same task, bloated → `/compact focus on <task>; keep files + test commands`.
5. New/unrelated task → `/clear`.
6. After compacting → verify with "summarize where we are."
7. End of major session → update `CLAUDE.md` with what changed.
