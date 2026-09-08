import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { transcriptPath } from '@theokit/sdk/persistence'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { projectDirFor } from '../../src/session/project-index.js'
import { deleteSession } from '../../src/session/session-lifecycle.js'

/**
 * theokit#675 — `registryRemoved` was computed as `outcome !== false`, so a remover that resolved
 * saying NOTHING was reported as a removal.
 *
 * That is the shape `Agent.delete` has, and it is exactly the shape that lies. Measured in
 * `@theokit/sdk@4.52.1` (`dist/chunk-KELIQH7K.js:589`) and confirmed by the SDK's own changelog for
 * `5.3.1`: `removeRegisteredAgent` mutates an IN-MEMORY map and schedules a save only when the entry
 * was in it, while `delete` — unlike `list` — never hydrates from disk. In any freshly started
 * process the entry is not in memory, so `Agent.delete` resolves `void` having left `registry.json`
 * untouched, and throws nothing.
 *
 * Three outcomes exist and only two were expressible. The third is not a boolean.
 */

const CWD = '/some/project'
let root: string

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'theokit-registry-'))
})
afterEach(() => {
  rmSync(root, { recursive: true, force: true })
})

function writeTranscript(sessionId: string): void {
  mkdirSync(projectDirFor(CWD, root), { recursive: true })
  writeFileSync(
    transcriptPath(root, CWD, sessionId),
    `${JSON.stringify({ type: 'user', sessionId })}\n`,
    'utf8',
  )
}

describe('a remover that says nothing has not confirmed anything (theokit#675)', () => {
  it('test_a_void_returning_remover_is_unconfirmed_not_removed', async () => {
    writeTranscript('exec-a')
    writeTranscript('exec-keeper') // so the target is not the most-recent, which is protected

    const result = await deleteSession('exec-a', {
      cwd: CWD,
      root,
      force: true,
      // The shape `Agent.delete` has: resolves, returns nothing, throws nothing.
      removeFromRegistry: () => undefined,
    })

    expect(result.registryOutcome).toBe('unconfirmed')
    expect(result.transcriptRemoved).toBe(true)
  })

  it('test_a_remover_that_reports_a_removal_is_removed', async () => {
    writeTranscript('exec-b')
    writeTranscript('exec-keeper')

    const result = await deleteSession('exec-b', {
      cwd: CWD,
      root,
      force: true,
      removeFromRegistry: () => true,
    })

    expect(result.registryOutcome).toBe('removed')
  })

  it('test_a_remover_that_reports_nothing_to_remove_says_so', async () => {
    // `false` was already an ordinary outcome and stays one — it is a REPORT, not a silence.
    writeTranscript('exec-c')
    writeTranscript('exec-keeper')

    const result = await deleteSession('exec-c', {
      cwd: CWD,
      root,
      force: true,
      removeFromRegistry: () => false,
    })

    expect(result.registryOutcome).toBe('nothing-to-remove')
    expect(result.transcriptRemoved).toBe(true)
  })

  it('test_a_failing_remover_leaves_the_transcript_and_says_it_failed', async () => {
    writeTranscript('exec-d')
    writeTranscript('exec-keeper')

    const result = await deleteSession('exec-d', {
      cwd: CWD,
      root,
      force: true,
      removeFromRegistry: () => {
        throw new Error('registry unreachable')
      },
    })

    expect(result.registryOutcome).toBe('failed')
    expect(result.registryError).toBeDefined()
    expect(result.transcriptRemoved).toBe(false)
  })
})
