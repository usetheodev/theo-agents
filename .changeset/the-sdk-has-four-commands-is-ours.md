---
'@theokit/agents': patch
---

Say, where a consumer can read it, why `CompatSurface` has five names and the SDK's has four

`CompatSurface` gained `'commands'` in #704 because this package reads
`<projectDir>/.claude/commands/*.md` itself. The SDK's own union still has four. A caller who
builds SDK `local` options directly therefore cannot pass a value of this type, and `TS2345` names
the mismatch without naming the reason.

The explanation existed only in `//` comments, which do not survive into the emitted `.d.ts` — so
it was invisible to exactly the audience that hits the error. It now lives in the JSDoc block that
does ship, together with the guidance to derive the SDK's four from this five rather than writing a
second list by hand: a hand-copied list goes stale the day a surface is added, which is the
divergence #704 existed to remove.

Documentation only; no behaviour changes. Reported by a consumer who hit the compiler error while
converging four call sites onto one declaration, and who supplied the sentence that was missing.
