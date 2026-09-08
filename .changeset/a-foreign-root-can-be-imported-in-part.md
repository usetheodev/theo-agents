---
'@theokit/agents': minor
---

A foreign configuration root can be imported in part

`resolveCompatSources` returned the bare literal `'claude-code'`, which the SDK reads as "import
every surface" — hooks, plugins, skills, subagents. `settingSources.claudeCode.import` now names the
surfaces, and the resolved value carries them.

The distinction is the reason the grant exists: `.claude/` usually arrives with the clone and its
`hooks.json` executes shell, so "take the skills, refuse the hooks" is the ordinary thing to want,
and the only choices were all of it or none of it.

Absent `import` still means the whole root, so nothing existing changes. An EMPTY list is refused
rather than guessed: "no surfaces" and "unset, so all of them" are both defensible readings of `[]`,
they differ by whether shell executes, and picking one would settle a security question by
convention.

`CompatSurface` and `ResolvedCompatSource` are declared here rather than imported from the SDK, for
the reason already recorded beside the literal: they do not exist in `@theokit/sdk@4.52.1`, this
package's declared floor.

Closes usetheokit/theokit#686.
