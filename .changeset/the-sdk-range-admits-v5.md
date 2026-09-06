---
'theokit': minor
'@theokit/agents': minor
'@theokit/presenter': minor
---

**`@theokit/sdk@5.x` is now supported, alongside 4.x**
([#654](https://github.com/usetheokit/theokit/issues/654)).

The declared range becomes `^4.52.1 || ^5.0.0` (`^4.49.0 || ^5.0.0` for `@theokit/presenter`), and
the full suite passes on both halves: 7533 tests against `4.52.1` and 7533 against `5.0.1`.

This unblocks plugins whose open-ended `@theokit/sdk` peer resolves to 5.x. Until now `theokit` was
the package that **refused** that resolution — the ERESOLVE named the plugin, but the bound that
could not be satisfied was this one.

**What had to change, and why it was not a version bump.** SDK 5.x writes a transcript to
`${sessionUuidFor(sessionId)}.jsonl` where 4.x wrote `${safeSessionId(sessionId)}.jsonl` — a
SHA-256 over a namespace, so the filename stopped being the session id and the mapping does not
invert. `listSessions` derived ids from filenames, so listing, protection, GC and deletion all
returned UUIDs where callers passed ids. One defect, twenty-nine failing tests.

The id is now read from the transcript **record**, which the SDK writes on both majors and which is
authoritative where the name was only a convention. The filename stem remains the fallback, so a
truncated transcript still appears in a listing rather than dropping out of GC's sight.

`LiveTranscriptError` — 5.x's new name for `LiveSessionError` — deliberately does not cross the
`@theokit/agents` layer: it does not exist on the 4.x half, and 5.x keeps the old name working and
deprecated, so the name that crosses is the one both majors have.
