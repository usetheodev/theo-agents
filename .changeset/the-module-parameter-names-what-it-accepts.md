---
'@theokit/agents': minor
'theokit': patch
'@theokit/tauri': minor
---

The agent-module parameter names what it accepts, so a wrong shape fails at compile time

`streamAgentTurnInProcess` and `compileAgentModule` took `mod: unknown`, so the contract lived only
in the runtime guard. A consumer whose producer became `async` handed a `Promise` straight through
and shipped two releases in which no turn could run — with typecheck, 1213 tests, lint and twelve CI
checks green. The runtime was never wrong: it refused the Promise and threw a typed error. What
failed was the moment.

Both now take `AgentModule`, exported alongside them and re-exported from `theokit/server/agent`.
The type mirrors the runtime guard rather than the fuller `CompiledAgentOptions` — an array under
`tools`, an object under `agents` — so it refuses nothing that compiled before.

`@theokit/tauri/sidecar`'s `runTurnToJsonl` is narrowed too: a desktop sidecar imports its agent
module statically, which is exactly where a type catches the mistake.

Entry points that receive a module from a path discovered at runtime keep taking `unknown`, and now
say so by calling the new `compileLoadedAgentModule`. Their `unknown` has a reason; before this, the
boundary that had one was indistinguishable from the one that did not.

Closes usetheokit/theokit#663.
