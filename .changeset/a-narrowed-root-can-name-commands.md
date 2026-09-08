---
'@theokit/agents': minor
---

A narrowed foreign root can name `commands`

`settingSources.claudeCode.import` narrows the foreign root to named surfaces, and `CompatSurface`
listed four of them — `hooks`, `plugins`, `skills`, `subagents`. It fed a fifth: this package loads
`<projectDir>/.claude/commands/*.md` itself, outside the SDK's `compatSources` path. The name was
missing from the vocabulary, so a consumer could neither ask for that directory nor be told it had
gone unread, and `loadCustomCommands` tested `sources.includes('claude-code')` — string equality
against a union whose narrowed member is an object, so every narrowed list read as *not declared*.

`CompatSurface` now includes `'commands'`, and the loader understands both shapes: the bare source
name grants every surface the root feeds, the narrowed form grants the ones it names.

Purely additive — before this, no narrowed list reached the directory at all, so nothing that works
today stops working. A narrowed list that wants foreign commands adds `'commands'` to `import`.

An enumeration used to narrow a root must cover every surface that root feeds; otherwise it is not
a narrowing but an undeclared drop. Reported as usetheokit/theokit#704, found by measuring a claim
in a consumer's adoption report rather than by any test here — the fifth time a gap in this
package's public surface was invisible from inside it.
