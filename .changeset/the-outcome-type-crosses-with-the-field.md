---
'@theokit/agents': patch
---

`RegistryOutcome` is exported alongside the field that uses it

`registryOutcome` shipped in `13.0.0-next.4` and its type did not, so a consumer could read the
value and not name it — `function handle(o: RegistryOutcome)` did not compile. A union whose members
cannot be named is read as `string`, which loses every distinction it exists to make.

Third instance of the same omission (`AgentModule` in #663, `transcriptOf` in #668), and the third
found by installing the published package into an empty project rather than by reading the source.
