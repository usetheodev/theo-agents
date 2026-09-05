/**
 * Types for `publish-log.mjs`, so its one pure function can be imported without a suppression.
 *
 * Fourth declaration file in this repository, after `preview-packages.d.mts`,
 * `sync-template-pins.d.mts` and `record-root-changelog.d.mts`. The scripts stay `.mjs` because
 * they run as release steps through plain `node`, with no build in front of them, and
 * `tests/integration/typecheck-clean-gate.test.ts` counts suppressions — so a declaration is the
 * honest answer rather than a `@ts-expect-error` that would also silence the next signature change.
 */

/**
 * What the publish said about one package, as opposed to what the registry says now.
 *
 * - `errored` — the publish reported a failure for this package (the `#366` shape: E404 on PUT).
 * - `written` — the publish named it and reported no failure; a registry read that has not
 *   resolved yet is registration lag, not a failed release.
 * - `unattempted` — the log never names it. Correct when no version was cut for it, and the
 *   `#366` empty green when one was; only the caller knows which.
 * - `unknown` — there is no log. Absence never becomes success.
 *
 * @param log combined output of `changeset publish`, or undefined when absent
 * @param pkg package name, e.g. `create-theokit`
 */
export function classifyFromPublishLog(
  log: string | undefined,
  pkg: string,
): 'errored' | 'written' | 'unattempted' | 'unknown'
