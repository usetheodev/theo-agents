---
'@theokit/tauri': patch
---

**Released because its peer requirement moved, not because this package changed.**

Nothing inside `@theokit/tauri` changed in this release. It ships because `theokit` moved and this
package peers it, so the peer range it declares moved with it — from the 0.64 line to
`>=0.65.0-next.0`. For a consumer that is a real, breaking difference even though no code here
differs: a project pinned to `theokit@0.64.x` cannot install this version.

The version number says the same thing less clearly. A peer range that excludes versions it used to
admit is a breaking change to whoever installs it, which is why the bump is a major rather than a
patch — the code is untouched and the contract is not.

**What to do:** upgrade `theokit` to `>=0.65.0` alongside this package, or stay on the previous
`@theokit/tauri` while you stay on the 0.64 line. Nothing else about the Tauri glue — the
Channel/invoke transport, the JSONL sidecar — behaves differently.

This entry exists because the release would otherwise carry an empty section
([#653](https://github.com/usetheokit/theokit/issues/653)), and an empty section is
indistinguishable from "nothing user-visible changed" — a claim nobody made about a major bump.
