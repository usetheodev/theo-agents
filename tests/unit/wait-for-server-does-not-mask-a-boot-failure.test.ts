import { createServer, type Server } from 'node:http'

import { afterEach, describe, expect, it } from 'vitest'

import { waitForServer } from '../integration/helpers/wait-for-server.js'

/**
 * theokit#699 — the helper has to close the readiness race WITHOUT hiding a real boot failure.
 * Those are the two ways to get this wrong, and a fixed `sleep` gets both wrong at once: it masks a
 * dead server for the length of the sleep and still races on a slow host.
 */

let server: Server | undefined
afterEach(() => {
  server?.close()
  server = undefined
})

describe('waitForServer closes the race without masking a failure (theokit#699)', () => {
  it('test_it_returns_once_a_server_that_starts_LATE_accepts', async () => {
    const s = createServer((_req, res) => res.end('ok'))
    server = s
    // Bind to a port nobody is listening on yet, then start listening after the first poll would
    // already have failed. Without polling this is the flake, verbatim.
    const port = 45_871
    setTimeout(() => s.listen(port), 120)
    await expect(waitForServer(port, 5_000)).resolves.toBeUndefined()
  })

  it('test_it_FAILS_on_a_port_nobody_ever_serves_and_says_so', async () => {
    // The anti-masking floor. A helper that swallowed this would turn every genuine boot failure
    // into a confusing assertion error three lines later.
    await expect(waitForServer(45_872, 300)).rejects.toThrow(/did not accept a connection/)
    await expect(waitForServer(45_872, 300)).rejects.toThrow(/boot failure/)
  })
})
