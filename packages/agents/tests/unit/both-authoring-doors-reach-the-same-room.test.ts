import { describe, expect, it } from 'vitest'

import { AgentBuilder } from '../../src/bridge/agent-builder.js'
import { compileAgentDefinition, defineAgent } from '../../src/bridge/define-agent.js'
import type { HookApprovalGate } from '../../src/bridge/sdk-adapter-create-options.js'

/**
 * theokit#686, fifth instance and a NEW variant.
 *
 * The first four were "the symbol exists and the barrel omits it", and the emitted-export guard
 * catches those. This one is different and that guard is green on it: `hookApproval` IS exported,
 * IS on `CompiledAgentOptions`, and IS reachable through `defineAgent`. What was missing is a method
 * on the FLUENT builder — so one authoring door could express the gate and the other could not.
 *
 * Found by the consumer, who lives on the builder:
 *
 *     .hookApproval({ approve })            TS2551: Property 'hookApproval' does not exist …
 *                                                   Did you mean 'approval'?
 *     .use(new HookApprovalCapability(…))   TS2345: not assignable to (builder) => unknown
 *
 * `use()` composes presets; it is not a capability sink. And there is no downstream escape: the
 * definition goes to `streamAgentTurnInProcess({ default: def }, …)` with `local` already assembled
 * inside, so a consumer has nowhere to inject `local.hooks` by hand.
 *
 * The shape of this test is the consumer's proposal, and it is better than a name check: it does not
 * validate a list, it builds the SAME agent through BOTH doors and asserts they arrive at the same
 * compiled waist. A door that cannot express what the other expresses fails here — including a door
 * that gains a field later and forgets the other.
 */

const approve: HookApprovalGate['approve'] = (r) => r.sourcePath?.includes('/.claude/') !== true

describe('both authoring doors reach the same room (theokit#686)', () => {
  it('test_the_fluent_builder_expresses_the_hook_gate_like_defineAgent_does', () => {
    const throughDefine = compileAgentDefinition(
      defineAgent({ model: 'm', hookApproval: { approve } }),
    )
    const throughBuilder = AgentBuilder.create().model('m').hookApproval({ approve }).build()

    expect(throughBuilder.hookApproval?.approve).toBe(approve)
    expect(throughBuilder.hookApproval).toEqual(throughDefine.hookApproval)
  })

  it('test_neither_door_invents_a_gate_that_was_not_asked_for', () => {
    // The anti-vacuity floor. Without it, a builder that always set a gate would satisfy the case
    // above, and "declared" would stop being distinguishable from "defaulted" — which for a security
    // decision is the difference that matters.
    expect(compileAgentDefinition(defineAgent({ model: 'm' })).hookApproval).toBeUndefined()
    expect(AgentBuilder.create().model('m').build().hookApproval).toBeUndefined()
  })
})
