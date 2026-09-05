/**
 * Types for `record-root-changelog.mjs`, so its one pure function can be imported without a
 * suppression.
 *
 * The script stays `.mjs` — it runs as a release step through plain `node`, with no build in front
 * of it. A declaration beside it is what gives the test real type checking instead of a
 * `@ts-expect-error`, which would silence any future change to this signature too. Third time in
 * this repository that the honest answer was a declaration file, after `preview-packages.d.mts`
 * and `sync-template-pins.d.mts`.
 */

/**
 * What the dated section should be for one `changeset version` run.
 *
 * `null` — and only — when no package version changed, because a heading naming no version is a
 * section `check-changelog-current.mjs` can never match.
 *
 * When versions WERE cut, a heading is always returned, including when `[Unreleased]` is empty.
 * The gate matches the heading, never the body, and a release the record does not name is one it
 * fails on later, attached to an unrelated pull request (#656). The body carries prose a human
 * wrote and never invents any.
 *
 * @param unreleasedBody the raw text under `## [Unreleased]`
 * @param cut versions bumped by this run, e.g. `['theokit 0.65.0']`
 * @param date ISO `YYYY-MM-DD` for the heading
 */
export function composeRecord(input: {
  unreleasedBody: string
  cut: string[]
  date: string
}): { heading: string; body: string } | null
