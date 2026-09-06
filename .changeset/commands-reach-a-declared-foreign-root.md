---
'@theokit/agents': minor
---

**A declared `.claude/` now reaches commands too** (theocode B-152).

`loadCustomCommands` takes `compatSources`, in the SDK's own vocabulary: `['claude-code']` adds
`<projectDir>/.claude/commands/` to what it reads.

Three surfaces already reached that directory when a consumer declared it — hooks, skills and
subagents, through the SDK's `compatSources`. Commands are loaded by this package instead, and were
the one surface that never learned about it. Measured against a real TUI: the same command file was
invocable under `.theokit/commands/` and silent under `.claude/commands/`, with no diagnostic
anywhere. A partial dialect is worse than none — whoever watched the other three work has no reason
to suspect the fourth.

**The trust gate does not move.** The foreign directory is read only when the caller declared it
AND the project is trusted, which is the same pair `resolveCompatSources` already requires. A
command is a prompt that runs on the operator's behalf, and this one usually arrives with the
repository, written for another product. An untrusted project now COUNTS the foreign commands it
refused, so the refusal is not silent either.

**The native root wins a name collision**, and the two frontmatter vocabularies stay separate: this
loader reads `description:` and nothing else, so the other product's `model` and `argument-hint`
are carried in the body rather than adopted.
