---
'theokit': patch
---

**The release guard no longer reports a published package as unpublished**
([#652](https://github.com/usetheokit/theokit/issues/652)).

npm registers a version minutes after `publish` returns — measured 5m04s for
`@theokit/sdk-cache@1.0.2` on 2026-09-04. `verify-release-published.mjs` read the registry with a
30s budget, so on any release with several packages it exhausted the budget and printed
`✗ <pkg>@<version> was NOT published` for packages that had published fine.

Raising the budget is the wrong knob: one large enough to be correct makes the gate mostly sleep,
and a six-minute gate is one people cancel.

**The two failures are distinguishable on the write path, not the read path.** `#366` — the
credential gone — is `E404 … PUT`, reported by the publish itself, immediately. Registration lag is
a successful PUT whose GET has not caught up. So `pnpm release` now records what `changeset publish`
said, and the guard reads it: a package the publish errored on fails the release naming that cause;
a package the publish wrote and the registry has not shown yet is reported as pending, not as a
failure; a package the publish never attempted is still the `#366` empty green and still fails.

Absence of a log never becomes success — it is reported as unconfirmed.
