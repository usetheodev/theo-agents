/**
 * Reading what the PUBLISH said, as opposed to what the registry says now.
 *
 * Its own module so it can be imported by a test without side effects:
 * `verify-release-published.mjs` is top-level code that queries the registry and calls
 * `process.exit`, so importing THAT to reach one pure function would run a release guard.
 */

/**
 * What did the PUBLISH say about this package — as opposed to what the registry says now?
 *
 * The two failures this guard has to tell apart look identical on the read path and are distinct
 * on the write path:
 *
 *   #366, credential gone   `error an error occurred while publishing X: E404 … PUT …`
 *   registration lag        `info X … is being published`, no error, and the GET 404s for minutes
 *
 * npm registers a version well after `publish` returns — 5m04s for `@theokit/sdk-cache@1.0.2` on
 * 2026-09-04 — so a read-only guard with any bounded budget reports the second as the first. The
 * publish already knows; this reads what it said.
 *
 * `unattempted` is not a synonym for failure. It is the #366 EMPTY GREEN: nothing was published
 * because every local version already existed, which is correct when no version was cut and is the
 * defect when one was. The caller decides, because only it knows which versions this release
 * declares.
 *
 * @param {string|undefined} log combined output of `changeset publish`, or undefined when absent
 * @param {string} pkg package name, e.g. `create-theokit`
 * @returns {'errored'|'written'|'unattempted'|'unknown'}
 */
export function classifyFromPublishLog(log, pkg) {
  if (typeof log !== 'string' || log.trim() === '') return 'unknown'

  const lines = log.split('\n')
  const mentions = lines.filter((line) => namesPackage(line, pkg))
  if (mentions.length === 0) return 'unattempted'

  const errored = mentions.some((line) => line.includes('error') && line.includes('publishing'))
  return errored ? 'errored' : 'written'
}

/**
 * Does this line name THIS package, rather than one whose name contains it?
 *
 * Substring matching is wrong here and the repository is the reason: `create-theokit` contains
 * `theokit`, and `@theokit/agents-pty` contains `@theokit/agents`. A substring test reports the
 * publish of one package as evidence about another — and in the direction that matters, it reports
 * a package nobody published as written.
 *
 * Token equality instead, allowing the `name@version` form changesets prints in its success list.
 */
function namesPackage(line, pkg) {
  for (const raw of line.split(/\s+/)) {
    const token = trimTrailingPunctuation(raw)
    if (token === pkg || token.startsWith(`${pkg}@`)) return true
  }
  return false
}

function trimTrailingPunctuation(token) {
  let end = token.length
  while (end > 0 && (token[end - 1] === ':' || token[end - 1] === ',' || token[end - 1] === '.')) {
    end--
  }
  return token.slice(0, end)
}
