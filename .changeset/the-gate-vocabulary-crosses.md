---
'@theokit/agents': patch
---

The hook gate's vocabulary crosses with the capability that takes it

`13.0.0-next.6` exported `HookApprovalCapability` and withheld `HookApprovalGate`,
`HookApprovalRequest` and `HookGateUnsupportedError`. A consumer could build the gate, and could
neither type the object it takes nor catch its refusal by class — which matters more here than
usual, because refusing loudly is the whole design.

Fourth instance of the same shape (#663 `AgentModule`, #668 `transcriptOf`, #675 `RegistryOutcome`),
and the first three were each found by installing the published package. The source is correct every
time: the type IS exported from its own module, and only the barrel omits it.

A guard now reads the EMITTED `dist/index.d.ts` export list rather than the source, and it was
proved able to fail by removing one export and watching it name that one.
