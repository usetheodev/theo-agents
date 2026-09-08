---
'@theokit/agents': minor
---

`AgentBuilder.create().hookApproval()` — the fluent twin of `defineAgent({ hookApproval })`

`13.0.0-next.7` shipped the hook approval gate reachable through `defineAgent` and capabilities, and
not through the fluent builder. A consumer that authors with `AgentBuilder.create()` had no way to
reach it: `.use()` composes presets rather than sinking capabilities, and the definition reaches
`streamAgentTurnInProcess` with `local` already assembled, so there was no downstream place to inject
`local.hooks` by hand either.

Fifth instance of one family and a NEW variant. The first four were "the symbol exists and the barrel
omits it", which the emitted-export guard now catches. This one is the opposite: the symbol is
exported, on the compiled waist, and reachable through one authoring door — the other door simply
does not offer it, and an export check is green on that.

So the guard for this variant builds the SAME agent through BOTH doors and asserts they arrive at the
same compiled waist. It catches the worst case too: an interface that declares the method while the
factory never wires it compiles, does nothing, and fails this test.
