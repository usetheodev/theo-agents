import { describe, it, expect } from 'vitest'
import { compileAgentModule, streamAgentTurnInProcess } from '../../src/index.js'
import { defineAgent, type AgentDefinition } from '../../src/bridge/define-agent.js'
import { AgentDefinitionError } from '../../src/bridge/agent-endpoint.js'

/**
 * theokit#663 — the module parameter used to be `unknown`, so a consumer handing over the wrong
 * shape learned about it on the FIRST TURN instead of at compile time. TheoCode shipped v0.7.0 and
 * v0.7.1 in which neither surface could take a turn, with twelve green CI checks, because
 * `buildChatAgent` became `async` and two call sites passed the Promise straight through.
 *
 * The runtime was never wrong: `compileAgentModule` refused the Promise and threw a typed error.
 * What failed was the MOMENT. This file closes both halves — the moment, and the runtime coverage
 * gap the issue named (17 tests exercised `compileAgentModule`; none refused a Promise).
 */

/**
 * The shapes the parameter must refuse, asserted by `tsc` rather than by the runner.
 *
 * `@ts-expect-error` fails the build in BOTH directions: it errors as unused (TS2578) the day the
 * parameter stops refusing these, and errors normally if a shape were ever made illegal for the
 * wrong reason. That makes the typechecker the verifier, so these live at module scope — running
 * them would only re-test the runtime guard, which the last case below does deliberately.
 *
 * Exported so it is not an unused symbol; it is never called.
 */
export function shapesTheModuleParameterMustRefuse(pending: Promise<AgentDefinition>): void {
  // @ts-expect-error theokit#663 — an async producer handed through unawaited (TheoCode v0.7.0)
  compileAgentModule({ default: pending })
  // @ts-expect-error theokit#663 — the same mistake without the module wrapper
  compileAgentModule(pending)
  // @ts-expect-error theokit#663 — the public in-process entry point refuses it too
  streamAgentTurnInProcess({ default: pending }, 'k', { message: 'hi' })
}

describe('agent module shape (theokit#663)', () => {
  it('test_every_shape_the_runtime_accepts_still_compiles', () => {
    const definition = defineAgent({ model: 'm' })
    const compiled = { tools: [], agents: {}, stream: true }
    // The bare value and the module wrapper are both real: `extractDefaultExport` unwraps a
    // `default` when present and passes the value through when not.
    expect(compileAgentModule(definition).model).toBe('m')
    expect(compileAgentModule({ default: definition }).model).toBe('m')
    expect(compileAgentModule(compiled).tools).toEqual([])
    expect(compileAgentModule({ default: compiled }).tools).toEqual([])
  })

  it('test_a_compiled_shape_carrying_only_what_the_guard_checks_is_accepted', () => {
    // `isCompiledAgentOptions` asks for `tools` and `agents` and inspects neither element type nor
    // `stream`. The parameter type mirrors the guard rather than the fuller `CompiledAgentOptions`,
    // so narrowing it refuses nothing that compiled before.
    expect(compileAgentModule({ default: { tools: [], agents: {} } }).tools).toEqual([])
  })

  it('test_a_promise_default_still_throws_a_typed_error_at_runtime', async () => {
    // The compile-time gate does not replace the runtime one: a consumer on plain JS, or one whose
    // module arrives from a dynamic `import()` typed `any`, reaches the runtime with no type in the
    // way. The cast is how this test reproduces that consumer.
    const pending = Promise.resolve(defineAgent({ model: 'm' }))
    const untyped = { default: pending } as unknown as Parameters<typeof compileAgentModule>[0]
    expect(() => compileAgentModule(untyped, 'agents/chat.ts')).toThrow(AgentDefinitionError)
    expect(() => compileAgentModule(untyped, 'agents/chat.ts')).toThrow(/agents\/chat\.ts/)
    await pending
  })
})
