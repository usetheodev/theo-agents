/**
 * A published package reported as unpublished is the failure this separates.
 *
 * `verify-release-published.mjs` reads the registry, and npm registers a version minutes after
 * `publish` returns — measured 2026-09-04 during the `@theokit/sdk@5.0.0` cut: `sdk-cache@1.0.2`
 * registered 5m04s after the call returned. The guard's budget is 30s, so it prints
 * `✗ … was NOT published` for packages that published fine (#652).
 *
 * Raising the budget is the wrong knob: at a budget large enough to be correct the guard mostly
 * sleeps, and a six-minute gate is one people cancel. The two cases are distinguishable, but not on
 * the read path — they are distinguishable on the WRITE path, and the publish already tells us:
 *
 *   #366 (credential gone):  `error an error occurred while publishing X: E404 … PUT …`
 *   registration lag:        `info X@1.2.3 is being published`, no error, GET 404 for now
 *
 * So the guard classifies from what the publish said, and the registry read only confirms.
 */
import { describe, expect, it } from 'vitest'

import { classifyFromPublishLog } from '../../scripts/publish-log.mjs'

const E404 = [
  'info create-theokit is being published because our local version (1.23.9) has not been published on npm',
  'error an error occurred while publishing create-theokit: E404 Not Found - PUT https://registry.npmjs.org/create-theokit - Not found',
].join('\n')

const OK = [
  'info theokit is being published because our local version (0.65.0) has not been published on npm',
  'success packages published successfully:',
  '@theokit/http@2.1.0',
].join('\n')

describe('the publish log separates a failed write from a lagging read (#652)', () => {
  it('reports a package the publish errored on as errored', () => {
    expect(classifyFromPublishLog(E404, 'create-theokit')).toBe('errored')
  })

  it('reports a package the publish attempted without error as written', () => {
    expect(classifyFromPublishLog(OK, 'theokit')).toBe('written')
  })

  it('reports a package the publish never mentioned as unattempted', () => {
    // This is the #366 empty green: the credential was absent, nothing was attempted, and the run
    // was still green because every local version already existed.
    expect(classifyFromPublishLog(OK, '@theokit/tauri')).toBe('unattempted')
  })

  it('reports unknown when there is no log to read', () => {
    // Absence of a log never becomes "the write succeeded" — the same reason an absent audit never
    // becomes "no CVE".
    expect(classifyFromPublishLog('', 'theokit')).toBe('unknown')
    expect(classifyFromPublishLog(undefined, 'theokit')).toBe('unknown')
  })

  it("does not let one package's error condemn another", () => {
    expect(classifyFromPublishLog(E404, 'theokit')).toBe('unattempted')
  })
})
