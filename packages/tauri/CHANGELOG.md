# Changelog — @theokit/tauri

## 1.0.0-next.1

### Patch Changes

- 3162888: **Released because its peer requirement moved, not because this package changed.**

  Nothing inside `@theokit/tauri` changed in this release. It ships because `theokit` moved and this
  package peers it, so the peer range it declares moved with it — from the 0.64 line to
  `>=0.65.0-next.0`. For a consumer that is a real, breaking difference even though no code here
  differs: a project pinned to `theokit@0.64.x` cannot install this version.

  The version number says the same thing less clearly. A peer range that excludes versions it used to
  admit is a breaking change to whoever installs it, which is why the bump is a major rather than a
  patch — the code is untouched and the contract is not.

  **What to do:** upgrade `theokit` to `>=0.65.0` alongside this package, or stay on the previous
  `@theokit/tauri` while you stay on the 0.64 line. Nothing else about the Tauri glue — the
  Channel/invoke transport, the JSONL sidecar — behaves differently.

  This entry exists because the release would otherwise carry an empty section
  ([#653](https://github.com/usetheokit/theokit/issues/653)), and an empty section is
  indistinguishable from "nothing user-visible changed" — a claim nobody made about a major bump.

## 1.0.0-next.0

### Patch Changes

- Updated dependencies [8333525]
  - theokit@0.65.0-next.0

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this package adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.1] - 2026-07-12

### Fixed

- **Published package no longer carries a `workspace:*` dependency.** `0.1.0` was published with `npm publish`, which (unlike `pnpm publish`) does not resolve the `theokit: workspace:*` dev dependency — so `npm install`-ing any project that depended on `@theokit/tauri@0.1.0` failed with `EUNSUPPORTEDPROTOCOL "workspace:"`. Republished with `pnpm publish` so every dependency resolves to a real version. `0.1.0` is deprecated.

## [0.1.0] - 2026-07-12

### Added

- Initial release — desktop transport glue for TheoKit agents (ADR-0055).
- **Webview** (`@theokit/tauri`): `createTauriChannelSource(core, { runCommand?, approveCommand? })` bridges an injected Tauri `{ invoke, Channel }` into a `ChannelPushSource` (the M42 `ChannelTransport` push contract) — JSONL `Channel` events (possibly multi-line) become `onLine`, the `run_turn` invoke resolves to `onClose` / rejects to `onError` (never swallowed, Rule 8), and `settle` routes a HITL decision to the `approve` command. `createTauriAgentClient(core, options?)` is the no-React convenience over M44 `createAgentClient`.
- **Node sidecar** (`@theokit/tauri/sidecar`): `runTurnToJsonl(mod, apiKey, message, write, awaitApproval?)` streams one agent turn via `streamAgentTurnInProcess` and writes each `UIMessageChunk` as a JSONL line; a thrown error is emitted as a trailing `{type:'error'}` line.
- `@tauri-apps/api` is an **optional** peer dependency — its primitives are injected structurally, so framework core `theokit` stays Tauri-agnostic (ADR-0045).
