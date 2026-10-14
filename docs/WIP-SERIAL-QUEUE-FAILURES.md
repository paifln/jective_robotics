# Serial queue and write failures

Source reports `SERIAL_QUEUE_LIMIT` with the exact number of oldest queued events discarded when the 2000-event queue overflows. The next delivery pump, disconnect or explicit close reports the count; the diagnostic does not invent connection metadata or physical observations. The bounded queue retains the newest events.

A readiness check now runs inside the open operation's cleanup path. If opening returns while the port is already closed, the service reports `PORT_CLOSED_DURING_OPEN`, clears its port reference and releases its transition lock. A subsequent open can succeed without a separate close command.

Explicit fake-transport tests cover unsupported baud rates, closed-port writes, oversized/protocol commands, write failure followed by recovery, interrupted open followed by retry, and a 3000-event flood reporting exactly 1000 lost events. These tests exercise software lifecycle behavior only. Real Electron enumeration/export checks remain separate; physical ports are not opened by these tests.

All 79 unit/integration tests passed. Device-service branch coverage is 70/82 (85.36 percent); total domain coverage is 665/797 (83.43 percent). SQLite workspace and compiler/uploader service still fail the per-file 80 percent gate. Type checking and lint passed. The source changes are after published 0.4.0; full product and physical acceptance remain incomplete.
