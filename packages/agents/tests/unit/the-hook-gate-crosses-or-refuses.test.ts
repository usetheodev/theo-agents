import { describe, expect, it } from 'vitest'

import {
  assembleM8CreateOptions,
  assertSdkCanGateHooks,
  HookGateUnsupportedError,
} from '../../src/bridge/sdk-adapter-create-options.js'
import type { CompiledAgentOptions } from '../../src/bridge/agent-compiler.js'

/**
 * theokit#686 — `@theokit/sdk@5.4.0` added `local.hooks.approve`, a consumer's decision point
 * BEFORE the runtime spawns a hook. This layer never forwarded it, so a hook declared in a foreign
 * config root ran shell without passing the consumer's approval.
 *
 * Measured in TheoCode against 5.4.0, with a control arm proving the zero was not an empty turn:
 *
 *     control_nothing             fires=0  tool_ran=yes
 *     claude_project_unapproved   fires=1  tool_ran=yes
 *
 * The forward is the easy half. The hard half is that the option is 5.4.0-only while this package
 * declares `^4.52.1 || ^5.0.0`, so a naive pass-through would compile and do NOTHING on most
 * admitted versions — a security gate that silently does not gate, which is worse than offering
 * none, because whoever configured it stops looking. The consumer said so in those words and
 * asked for the refusal rather than the forward.
 *
 * The version check is a pure function so both directions are testable without installing two SDKs.
 */

const base = (): CompiledAgentOptions => ({ tools: [], agents: {}, stream: true })

describe('the hook approval gate crosses, or refuses to pretend (theokit#686)', () => {
  it('test_an_sdk_that_can_gate_is_accepted', () => {
    // `HookApprovalGate` landed in 5.4.0. Anything at or above it can honour the forward.
    expect(() => assertSdkCanGateHooks('5.4.0')).not.toThrow()
    expect(() => assertSdkCanGateHooks('5.4.1')).not.toThrow()
    expect(() => assertSdkCanGateHooks('6.0.0')).not.toThrow()
  })

  it('test_an_sdk_that_cannot_gate_is_refused_by_name_and_version', () => {
    // Every version this package admits below 5.4.0 — measured by unpacking the tarballs, not
    // inferred: 4.52.1 and 5.0.0 have no `HookApprovalGate` at all.
    for (const v of ['4.52.1', '4.63.5', '5.0.0', '5.3.3']) {
      expect(() => assertSdkCanGateHooks(v), `${v} must be refused`).toThrow(
        HookGateUnsupportedError,
      )
    }
    expect(() => assertSdkCanGateHooks('5.0.0')).toThrow(/5\.4\.0/)
    expect(() => assertSdkCanGateHooks('5.0.0')).toThrow(/5\.0\.0/)
  })

  it('test_an_unreadable_version_is_refused_rather_than_assumed', () => {
    // The sibling warning for `compatSources` stays silent when the version cannot be read, because
    // a diagnostic is not worth refusing an agent over. This one is the opposite: the whole point is
    // that the caller must not believe a gate is installed. Unknown means unproven, and unproven
    // must not read as gated.
    expect(() => assertSdkCanGateHooks(undefined)).toThrow(HookGateUnsupportedError)
    expect(() => assertSdkCanGateHooks('not-a-version')).toThrow(HookGateUnsupportedError)
  })

  it('test_a_declared_gate_reaches_the_sdk_local_options', () => {
    const approve = (): boolean => true
    const { options, applied } = assembleM8CreateOptions(
      { ...base(), hookApproval: { approve } },
      { sdkVersion: '5.4.0' },
    )
    expect(options.local?.hooks?.approve).toBe(approve)
    expect(applied).toContain('hookApproval')
  })

  it('test_no_declared_gate_forwards_nothing_and_checks_nothing', () => {
    // An agent that declares no gate must not be refused on an old SDK — the refusal exists to
    // protect a promise nobody made here.
    const { options, applied } = assembleM8CreateOptions(base(), { sdkVersion: '4.52.1' })
    expect(options.local?.hooks).toBeUndefined()
    expect(applied).not.toContain('hookApproval')
  })

  it('test_a_declared_gate_on_an_old_sdk_refuses_at_assembly', () => {
    expect(() =>
      assembleM8CreateOptions(
        { ...base(), hookApproval: { approve: () => true } },
        { sdkVersion: '5.0.0' },
      ),
    ).toThrow(HookGateUnsupportedError)
  })
})
