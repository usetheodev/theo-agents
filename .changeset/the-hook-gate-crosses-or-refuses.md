---
'@theokit/agents': minor
---

The pre-spawn hook approval gate crosses the layer, or refuses to pretend it did

`@theokit/sdk@5.4.0` added `local.hooks.approve` — a consumer's decision point before the runtime
spawns a hook. This layer never forwarded it, so a hook declared in a config root, including a
foreign dialect imported through `compatSources`, ran shell without passing the consumer's approval.

Measured in a consumer against 5.4.0, with a control arm proving the zero was not an empty turn:

```
control_nothing             fires=0  tool_ran=yes
claude_project_unapproved   fires=1  tool_ran=yes
```

`defineAgent({ hookApproval })` and the new `HookApprovalCapability` now carry it to
`Agent.create({ local: { hooks } })`. Named `hookApproval` rather than `hooks` because
`defineAgent({ hooks })` is already the LIFECYCLE seam, and two security-relevant things under one
name is how a consumer configures the wrong one.

**Declaring it against an SDK older than 5.4.0 is REFUSED, not forwarded.** The option is 5.4.0-only
while this package's floor is `^4.52.1`, so a pass-through would compile and do nothing on most
admitted versions — a gate that silently does not gate, which is worse than offering none, because
whoever configured it stops looking. An unreadable SDK version is refused for the same reason:
"cannot tell" and "is gated" must not collapse.

The floor is unchanged, so no consumer is pinned to a newer SDK for a feature they did not ask for.

Closes usetheokit/theokit#686 (the `hooks` half; `resolveCompatSources` widening is tracked there).
