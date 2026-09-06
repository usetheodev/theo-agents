/**
 * M48 T2.2 — unit tests for the dependency-free caret checker that both the contract-test drift
 * guard and the boot-time fail-fast rely on. The live drift these guard: SDK 3.5.0 must NOT satisfy
 * the `^4.0.1` framework floor (it did, silently, via the stale root hoist).
 */
import { describe, expect, it } from 'vitest'

import {
  SUPPORTED_SDK_RANGE,
  satisfiesSdkRange,
} from '../../packages/theo/src/server/agent/sdk-compat.js'

describe('satisfiesSdkRange (M48 T2.2)', () => {
  it('test_accepts_patch_and_minor_within_caret', () => {
    expect(satisfiesSdkRange('4.0.1', '^4.0.1')).toBe(true)
    expect(satisfiesSdkRange('4.0.2', '^4.0.1')).toBe(true)
    expect(satisfiesSdkRange('4.3.0', '^4.0.1')).toBe(true)
  })

  it('test_rejects_below_floor_and_next_major', () => {
    expect(satisfiesSdkRange('4.0.0', '^4.0.1')).toBe(false)
    expect(satisfiesSdkRange('3.5.0', '^4.0.1')).toBe(false) // the exact live drift
    expect(satisfiesSdkRange('5.0.0', '^4.0.1')).toBe(false)
  })

  it('test_or_joined_caret_series_passes_on_any_clause', () => {
    expect(satisfiesSdkRange('1.2.0', '^0.14.0 || ^1.0.0')).toBe(true)
    expect(satisfiesSdkRange('0.14.3', '^0.14.0 || ^1.0.0')).toBe(true)
    expect(satisfiesSdkRange('0.15.0', '^0.14.0 || ^1.0.0')).toBe(false)
  })

  it('test_zero_major_caret_locks_the_minor', () => {
    expect(satisfiesSdkRange('0.11.5', '^0.11.0')).toBe(true)
    expect(satisfiesSdkRange('0.12.0', '^0.11.0')).toBe(false)
  })

  it('test_prerelease_never_satisfies_a_stable_caret', () => {
    expect(satisfiesSdkRange('4.0.2-next.1', '^4.0.1')).toBe(false)
    expect(satisfiesSdkRange('4.0.2-next.1', '^4.0.2-next.0')).toBe(true)
  })

  it('test_supported_range_spans_both_supported_majors', () => {
    // `@theokit/sdk@5.x` renamed transcript files to a one-way hash of the session id
    // (usetheokit/theokit#654); this package reads the id from the record instead, which is the
    // same answer under either scheme — so both majors are genuinely supported, and the range says
    // so in the form `satisfiesSdkRange` understands. Alternation, not `>=x <y`: this checker is
    // caret-only by ADR D1 and is what the boot-time fail-fast uses.
    expect(SUPPORTED_SDK_RANGE).toBe('^4.0.1 || ^5.0.0')
    expect(satisfiesSdkRange('4.52.1', SUPPORTED_SDK_RANGE)).toBe(true)
    expect(satisfiesSdkRange('5.0.1', SUPPORTED_SDK_RANGE)).toBe(true)
    expect(satisfiesSdkRange('6.0.0', SUPPORTED_SDK_RANGE)).toBe(false)
  })
})
