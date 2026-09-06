#!/usr/bin/env node
/**
 * Move the root CHANGELOG's `[Unreleased]` under a dated heading naming the versions just cut.
 *
 * ## Why this is a script and not a discipline
 *
 * `check-changelog-current.mjs` says it plainly: "`changeset version` never touches this file —
 * only a person does." That sentence describes the defect rather than the design. The root file is
 * hand-maintained, nothing in the release chain writes it, and the record has fallen behind the
 * registry FOUR times:
 *
 *   59720883b  "three releases reached npm without reaching this file"
 *   c5b69972d  "two releases had reached the registry without reaching this file"
 *   21b706800  "two releases reached the registry without reaching this file"
 *   theokit@0.60.0 — this one, found by the gate on the promotion PR
 *
 * The fourth is the one that shows a rule cannot fix it. It was recorded ON PURPOSE, ahead of the
 * tag, in a commit on `changeset-release/main`. Then merging an unrelated PR into `main` re-ran
 * `release.yml`, which regenerates that branch with `git push --force-with-lease`, and the record
 * went with it. Doing the right thing by hand was not enough, because a hand-made commit on a
 * machine-owned branch does not survive the machine.
 *
 * So the write moves to where the versions are decided: inside `version-packages`, immediately
 * after `changeset version`, on the same commit the bot makes. Regenerating the branch now
 * regenerates the record too.
 *
 * ## What it does, and what it refuses to do
 *
 * It MOVES prose a human already wrote. It never invents an entry: the body under `[Unreleased]` is
 * carried across verbatim, and if that section is empty the script exits 0 having done nothing —
 * a release with no consumer-visible changes is a real thing (a dependency bump, a re-publish), and
 * inventing a line for it would be worse than the silence.
 *
 * Category blocks are merged and ordered Added / Changed / Deprecated / Removed / Fixed / Security
 * per Keep a Changelog, because `[Unreleased]` accumulates duplicates as several PRs append to it.
 *
 * Usage: `node scripts/record-root-changelog.mjs [--check]`
 *   --check  report what WOULD be written and exit non-zero if anything is pending. Writes nothing.
 */
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const CHANGELOG = resolve(REPO_ROOT, 'CHANGELOG.md')

/** Keep a Changelog's order. A category outside this list is kept, after the known ones. */
const CATEGORY_ORDER = ['Added', 'Changed', 'Deprecated', 'Removed', 'Fixed', 'Security']

/** `git diff` argv, hoisted so the call fits on one line under its lint directive. */
const DIFF_ARGV = ['diff', '--name-only', '--', 'packages/*/package.json']

/**
 * The packages whose version this working tree just changed, as `name x.y.z`.
 *
 * Read from the DIFF rather than from the changesets, because the diff is what actually happened:
 * `changeset version` decides the bump, and a package it chose to leave alone must not appear in a
 * heading claiming it shipped.
 */
function versionsJustCut() {
  // eslint-disable-next-line sonarjs/no-os-command-from-path -- toolchain binary, fixed argv
  const changed = execFileSync('git', DIFF_ARGV, { cwd: REPO_ROOT, encoding: 'utf8' })
    .split('\n')
    .filter(Boolean)

  const cut = []
  for (const path of changed) {
    const now = JSON.parse(readFileSync(resolve(REPO_ROOT, path), 'utf8'))
    let before
    try {
      // eslint-disable-next-line sonarjs/no-os-command-from-path -- toolchain binary, fixed argv
      const previous = execFileSync('git', ['show', `HEAD:${path}`], {
        cwd: REPO_ROOT,
        encoding: 'utf8',
      })
      before = JSON.parse(previous)
    } catch {
      continue // a new package has no previous version to compare against
    }
    if (before.version !== now.version) cut.push(`${now.name} ${now.version}`)
  }
  return cut
}

/**
 * Strip leading and trailing newlines without a regex.
 *
 * `/^\n+|\n+$/g` expresses this in one line and is an alternation of two quantifiers over
 * attacker-shaped input, which is exactly the backtracking shape the lint refuses. A loop is
 * linear, obvious, and needs no exemption.
 */
function trimNewlines(text) {
  let start = 0
  let end = text.length
  while (start < end && text[start] === '\n') start++
  while (end > start && text[end - 1] === '\n') end--
  return text.slice(start, end)
}

/** Split `[Unreleased]`'s body into `{ Category: [entry, …] }`, preserving each entry verbatim. */
function bucketsOf(body) {
  const buckets = new Map()
  const parts = body.split(/^(### .+)$/m)
  for (let i = 1; i < parts.length; i += 2) {
    const name = parts[i].replace(/^###\s+/, '').trim()
    const content = trimNewlines(parts[i + 1])
    if (content === '') continue
    buckets.set(name, [...(buckets.get(name) ?? []), content])
  }
  return buckets
}

/**
 * Decide what the dated section should be — the whole policy, in one pure function so it can be
 * tested without a git fixture.
 *
 * Two rules, and they answer different questions:
 *
 *   - A version was cut  -> there MUST be a heading naming it. `check-changelog-current.mjs`
 *     matches on the heading and never on the body, and a release the record does not name is a
 *     release that gate fails on — days later, attached to an unrelated pull request (#656).
 *   - Prose is MOVED, never synthesised. A release with no consumer-visible change is a real
 *     thing; a generated line describing it would put words in the record that nobody chose.
 *
 * So an empty `[Unreleased]` yields a heading and a pointer to where the detail actually lives,
 * not an invented `### Added`.
 *
 * @returns {{heading: string, body: string} | null} null when there is nothing to name.
 */
export function composeRecord({ unreleasedBody, cut, date }) {
  if (cut.length === 0) return null

  const heading = `## [${cut.join(', ')}] - ${date}`
  const buckets = bucketsOf(unreleasedBody)

  if (buckets.size === 0) {
    return {
      heading,
      body: "Released with no entry under `[Unreleased]`. Per-package detail is in each package's\nown `CHANGELOG.md`.",
    }
  }

  const known = CATEGORY_ORDER.filter((c) => buckets.has(c))
  const extra = [...buckets.keys()].filter((c) => !CATEGORY_ORDER.includes(c))

  return {
    heading,
    body: [...known, ...extra]
      .map((name) => `### ${name}\n\n${buckets.get(name).join('\n\n')}`)
      .join('\n\n'),
  }
}

function main() {
  const check = process.argv.includes('--check')
  const source = readFileSync(CHANGELOG, 'utf8')

  const start = source.indexOf('## [Unreleased]')
  if (start === -1) {
    console.error('✗ [changelog] no `## [Unreleased]` heading — refusing to guess where to write.')
    process.exit(1)
  }
  const afterHeading = start + '## [Unreleased]'.length
  const next = source.indexOf('\n## ', afterHeading)
  const end = next === -1 ? source.length : next + 1
  const body = source.slice(afterHeading, end)

  const cut = versionsJustCut()
  const record = composeRecord({
    unreleasedBody: body,
    cut,
    date: new Date().toISOString().slice(0, 10),
  })

  if (record === null) {
    // Not an error: this runs inside `version-packages`, and a run where changesets bumped nothing
    // is a run with nothing to name. Recording under a heading naming no version would produce a
    // section the release-record gate can never match.
    console.log('✓ [changelog] no package version changed in this tree — nothing to record.')
    return
  }

  const { heading, body: sections } = record

  if (check) {
    console.error(
      `✗ [changelog] ${cut.length} version(s) cut with entries still under [Unreleased].`,
    )
    console.error(`    would write: ${heading}`)
    process.exit(1)
  }

  const rewritten =
    source.slice(0, start) +
    // One trailing blank line, whichever branch produced the body: the bucket path ends with a
    // newline of its own and the pointer path does not, and `source.slice(end)` starts at `## `.
    `## [Unreleased]\n\n${heading}\n\n${trimNewlines(sections)}\n\n` +
    source.slice(end)
  writeFileSync(CHANGELOG, rewritten)
  console.log(`✓ [changelog] recorded ${heading}`)
}

// Only when run as a script — importing this module must not rewrite the CHANGELOG.
if (process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main()
}
