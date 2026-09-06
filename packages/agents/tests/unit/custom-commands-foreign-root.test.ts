/**
 * A declared `.claude/` must reach commands too, or the dialect is partial.
 *
 * Measured 2026-09-05 by the `theocode` session: in a project that declares the foreign root, a
 * rule reaches the model, a skill is invocable and a subagent is delegated — and a command in
 * `.claude/commands/` is silent. The file is on disk, the name never appears, and nothing says why.
 *
 * A partial dialect is worse than none: somebody who watched the other three work has no reason to
 * suspect the fourth. The three that work go through the SDK's `compatSources`; commands are loaded
 * by THIS package (`loadCustomCommands`), which never learned about the foreign root.
 *
 * The trust gate does not move. `.claude/commands/*.md` are prompts that run on the operator's
 * behalf, exactly like `.theokit/commands/*.md`, and they arrive with the repository more often —
 * so they are read only when the project is trusted AND the caller declared the source, which is
 * the same pair `resolveCompatSources` already requires for hooks, skills and subagents.
 */
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { loadCustomCommands } from '../../src/config/custom-commands.js'

function project(): string {
  return mkdtempSync(join(tmpdir(), 'cc-foreign-'))
}

function writeCommand(dir: string, root: string, name: string, body: string): void {
  const target = join(dir, root, 'commands')
  mkdirSync(target, { recursive: true })
  writeFileSync(join(target, `${name}.md`), body, 'utf8')
}

describe('a declared foreign root reaches commands too (theocode B-152)', () => {
  it('test_a_claude_command_loads_when_the_source_is_declared_and_trusted', () => {
    const dir = project()
    writeCommand(dir, '.claude', 'review', 'Review this.\n')

    const result = loadCustomCommands({
      projectDir: dir,
      projectTrusted: true,
      compatSources: ['claude-code'],
    })

    expect(result.commands.map((c) => c.name)).toContain('review')
  })

  it('test_the_positive_control_the_same_file_under_theokit_loads', () => {
    // Distinguishes "read from the foreign root" from "read at all" — the arm the report asked for.
    const dir = project()
    writeCommand(dir, '.theokit', 'review', 'Review this.\n')

    const result = loadCustomCommands({ projectDir: dir, projectTrusted: true })

    expect(result.commands.map((c) => c.name)).toContain('review')
  })

  it('test_it_stays_silent_when_the_source_is_not_declared', () => {
    // Not a regression: reading another product's prompt directory without being asked is the
    // behaviour `usetheokit/theokit-sdk#524` removed everywhere else.
    const dir = project()
    writeCommand(dir, '.claude', 'review', 'Review this.\n')

    const result = loadCustomCommands({ projectDir: dir, projectTrusted: true })

    expect(result.commands.map((c) => c.name)).not.toContain('review')
  })

  it('test_an_untrusted_project_does_not_load_the_foreign_root_either', () => {
    const dir = project()
    writeCommand(dir, '.claude', 'review', 'Review this.\n')
    const warnings: string[] = []

    const result = loadCustomCommands({
      projectDir: dir,
      projectTrusted: false,
      compatSources: ['claude-code'],
      onWarn: (m) => warnings.push(m),
    })

    expect(result.commands.map((c) => c.name)).not.toContain('review')
    expect(warnings.join(' '), 'silence here is the defect this whole item is about').toMatch(
      /not trusted/i,
    )
  })

  it('test_the_native_root_wins_a_name_collision', () => {
    const dir = project()
    writeCommand(dir, '.claude', 'review', 'Foreign.\n')
    writeCommand(dir, '.theokit', 'review', 'Native.\n')

    const result = loadCustomCommands({
      projectDir: dir,
      projectTrusted: true,
      compatSources: ['claude-code'],
    })

    const review = result.commands.find((c) => c.name === 'review')
    expect(review?.path, 'this project owns its own name').toContain('.theokit')
  })
})
