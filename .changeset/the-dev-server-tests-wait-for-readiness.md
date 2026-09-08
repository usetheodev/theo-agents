---
'theokit': patch
---

The dev-server integration tests wait until the server accepts

Two release pull requests failed on `TypeError: fetch failed` in one day. `startDevServer` resolving
assigns the address; it does not make the listener accept, and the tests read `.address().port` the
instant the promise settled and connected. `port: 0` sharpens it — the address cannot be pre-checked.

"Resolved is not ready" is the same sentence this package wrote about a different promise when
`Agent.delete` resolved having removed nothing.

`waitForServer` polls until one connection succeeds, and on exhaustion FAILS naming the port and the
elapsed time, so a genuine boot failure stays distinguishable from a slow one. Not a fixed sleep: a
sleep turns a race into a slower race and hides it on fast machines.

Closes usetheokit/theokit#699.
