import { describe, expect, it } from 'vitest'

import { resolveCompatSources } from '../../src/bridge/setting-sources-gate.js'
import type { SettingSourcesSelection } from '../../src/bridge/setting-sources-gate.js'

/**
 * theokit#686, the second half. `resolveCompatSources` returned the bare literal `'claude-code'`,
 * which the SDK reads as "import EVERY surface of that root" — hooks, plugins, skills, subagents.
 *
 * `@theokit/sdk@5.4.0` accepts a narrowed form, so a consumer can take a foreign root's skills and
 * subagents WITHOUT its hooks. That distinction is the whole reason the grant exists: `.claude/`
 * usually arrives with the clone, and `hooks.json` executes shell. Being forced to choose between
 * all of it and none of it is what the consumer reported.
 *
 * The union is declared locally rather than imported, for the reason already written beside the
 * literal: `CompatSource` does not exist in `@theokit/sdk@4.52.1`, this package's declared floor, so
 * importing it would stop the package building against its own minimum.
 */

const trusted = {
  trustedBy: {
    level: 'trusted',
    source: 'test',
    allows: { projectSettings: true },
  },
} as unknown as NonNullable<SettingSourcesSelection['claudeCode']>

describe('a foreign root can be imported in part (theokit#686)', () => {
  it('test_no_import_list_still_means_the_whole_root', () => {
    // Back-compat floor: every existing caller declares no surfaces and must keep meaning "all of
    // it". A change that silently narrowed them would remove skills nobody asked to remove.
    expect(resolveCompatSources({ claudeCode: trusted })).toEqual(['claude-code'])
  })

  it('test_a_declared_import_list_narrows_what_crosses', () => {
    expect(
      resolveCompatSources({ claudeCode: { ...trusted, import: ['skills', 'subagents'] } }),
    ).toEqual([{ kind: 'claude-code', import: ['skills', 'subagents'] }])
  })

  it('test_an_empty_import_list_is_refused_rather_than_read_as_everything', () => {
    // `[]` is the one input where the two readings differ and both are defensible — "nothing" or
    // "unset, so everything". Guessing either way decides a security question by convention, so it
    // is refused and the caller says which they meant.
    expect(() => resolveCompatSources({ claudeCode: { ...trusted, import: [] } })).toThrow(/empty/i)
  })

  it('test_the_grant_is_still_required_before_any_of_this', () => {
    const untrusted = {
      trustedBy: { level: 'untrusted', source: 'test', allows: { projectSettings: false } },
    } as unknown as NonNullable<SettingSourcesSelection['claudeCode']>
    expect(() =>
      resolveCompatSources({ claudeCode: { ...untrusted, import: ['skills'] } }),
    ).toThrow()
  })
})
