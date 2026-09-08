---
'@theokit/agents': minor
---

`deleteSession` stops reporting a registry removal it cannot confirm

`registryRemoved` was computed as `outcome !== false`, so a remover that resolved saying **nothing**
was reported as a removal. That is the shape `Agent.delete` has — `Promise<void>` — and below
`@theokit/sdk@5.3.1` it is what a no-op returns: measured in `4.52.1`, `removeRegisteredAgent`
mutates an in-memory map and schedules a save only when the entry was in it, while `delete` — unlike
`list` — never hydrates from disk. In any freshly started process the entry is not in memory, so the
call resolves having left `registry.json` untouched and throws nothing.

Breaking, inside the unreleased 13.0.0 line:

- `DeleteSessionResult.registryRemoved: boolean` is replaced by
  `registryOutcome: 'removed' | 'nothing-to-remove' | 'unconfirmed' | 'failed' | 'not-attempted'`.
  Renamed rather than retyped: `if (result.registryRemoved)` would have kept compiling while
  silently changing which branch it took.
- `SessionInUseError.registryRemoved` becomes `registryOutcome`, and the refusal no longer advertises
  "the registry entry was already removed" for a half it cannot confirm — it tells the caller to
  verify instead.

`not-attempted` and `unconfirmed` are distinct on purpose: "nobody asked" and "we asked and got
silence" lead a caller to opposite actions, and the old boolean said `false` to both.

The declared SDK range is unchanged. `5.3.1` fixes the behaviour and not the signature — `delete`
still returns `Promise<void>` — so `unconfirmed` remains the honest answer on every admitted version,
and raising the floor is a separate decision that would make the removal happen without making it
reportable.

Closes usetheokit/theokit#675.
