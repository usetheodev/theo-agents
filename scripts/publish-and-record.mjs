#!/usr/bin/env node
/**
 * Run `changeset publish` and keep what it said.
 *
 * The output is the only record of the WRITE outcome, and it is the one thing that separates the
 * two failures `verify-release-published.mjs` has to tell apart:
 *
 *   usetheokit/theokit#366   `error an error occurred while publishing X: E404 … PUT …`
 *   usetheokit/theokit#652   `info X is being published`, no error, and the GET 404s for minutes
 *
 * Both look identical on the read path, so the guard was calling published packages unpublished.
 * npm registered `@theokit/sdk-cache@1.0.2` 5m04s after the call returned; no bounded read budget
 * survives that, and an unbounded one is a gate people cancel.
 *
 * Output is streamed through unchanged — the CI log reads exactly as it did — and also written to
 * `.release-publish.log`, which is gitignored and lives only for the length of the job.
 *
 * The exit code is the child's, so this is transparent in the `&&` chain that calls it. Note that
 * changesets exits 0 even when every package E404s (that is #366's whole point), which is why the
 * log matters rather than the status.
 */
import { spawn } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const LOG = '.release-publish.log'

// The workspace's own binary, not whatever `changeset` PATH happens to resolve to. A release
// decides what reaches the registry, so the tool it runs should not depend on the shell's
// environment — and naming the path is a better answer than suppressing the lint that asks.
const CHANGESET = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'node_modules',
  '.bin',
  'changeset',
)

const child = spawn(CHANGESET, ['publish'], { shell: false })
let captured = ''

for (const [stream, sink] of [
  [child.stdout, process.stdout],
  [child.stderr, process.stderr],
]) {
  stream.on('data', (chunk) => {
    captured += chunk.toString()
    sink.write(chunk)
  })
}

child.on('error', (error) => {
  console.error(`✗ [release] could not run \`changeset publish\`: ${error.message}`)
  process.exit(1)
})

child.on('close', (code) => {
  try {
    writeFileSync(LOG, captured)
  } catch (error) {
    // Never fail a publish over the log. The guard treats an absent log as unknown, which is the
    // honest reading — it does not treat it as success.
    console.error(`⚠ [release] could not write ${LOG}: ${error.message}`)
  }
  process.exit(code ?? 1)
})
