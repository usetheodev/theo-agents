---
'theokit': patch
---

**The root release record now names every version that was cut, including releases nobody wrote
prose for** ([#656](https://github.com/usetheokit/theokit/issues/656)).

`record-root-changelog.mjs` returned early whenever `## [Unreleased]` was empty, so a second
`changeset version` run — one whose prose the previous cut had already drained — bumped packages
and left the root record silent about them. `check-changelog-current.mjs` then failed, hours later,
attached to whichever unrelated pull request happened to run CI next.

The two scripts disagreed about what silence means: one treated an empty `[Unreleased]` as nothing
to do, the other treats an unnamed release as a defect. The heading settles it — the gate matches
on the heading naming the version and never on the body.

**The rule that prose is moved and never invented is unchanged.** A heading is a fact about what
was cut and when; a change description is a claim about what changed, and stays the human's to
write. A release with no entry gets its heading plus a pointer to the per-package changelogs, not a
generated `### Added`.
