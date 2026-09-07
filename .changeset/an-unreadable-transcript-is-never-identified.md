---
'@theokit/agents': minor
'theokit': patch
---

A transcript nobody can read is listed without an id, and keeps its protection

`listSessions` fell back to the filename stem whenever the first record could not be read. Under
`@theokit/sdk` 5.x that stem is a one-way hash of the id, so the fallback did not return a degraded
id — it returned an identifier belonging to no session. Session GC keyed protection on it, so a
session someone had DECLARED protected lost its protection and was planned for deletion, while the
registry removal was called with the hash and left the real entry behind.

Protection now runs in the direction that has a function. `transcriptPath(root, cwd, id)` is total on
both majors and its inverse is not, so protection is keyed by transcript PATH and caller-supplied ids
are mapped forward onto paths. Whether a transcript can be read stops mattering to whether it is
protected.

Breaking, inside the unreleased 13.0.0 line:

- `SessionSummary.id` is `string | undefined`, alongside a new `idSource: 'transcript' | 'unavailable'`.
  It is never derived from the filename.
- **`protectedTranscripts` is RENAMED to `protectedTranscriptPaths`, and the rename is the fix.** Its
  keys changed from session ids to transcript paths while the signature stayed `Map<string, string>`,
  so a consumer that mapped the keys forward through `transcriptPath` — correct when they were ids —
  kept compiling and started double-mapping, leaving its protection array matching nothing. Measured
  on a real consumer against this build: `deleteSession` collected a session holding a LIVE writer
  lease. The old name is gone rather than aliased; a silent break that loses data is worse than a
  loud one, and an alias would have preserved the silence. `transcriptOf(id, cwd, root)` maps forward
  for callers that hold an id.
- `GCCandidate.id`, `GCKept.id` and `GCError.id` admit `undefined` for the same reason.
- `RunTranscriptGCResult` gains `orphaned` — transcripts collected whose session id could not be
  read, by path. A separate list rather than a second meaning inside `removed`, which answers "which
  sessions did I collect"; `theo sessions gc` reports both, and never prints a filename where an id
  belongs.

Closes usetheokit/theokit#668.
