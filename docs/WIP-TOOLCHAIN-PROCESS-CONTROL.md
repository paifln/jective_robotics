# CLI process control

Cancellation is now accepted while the service prepares its isolated configuration. After configuration completes, a pending cancellation returns interrupted without spawning the command. Previously cancel returned false during this interval and the command could subsequently start. The running lock remains held until preparation finishes, preventing a second operation from racing the cancelled preparation.

Five additional tests exercise real local Node child processes rather than simulated process callbacks. They verify stdout/stderr capture, nonzero exit status, the one-million-character log tail, concurrent-command refusal, Windows taskkill cancellation, timeout termination and recovery, and configuration failure recovery. A deliberately gated configuration verifies early cancellation prevents a marker-writing child from launching. These tests never invoke Arduino upload or serial access.

All 93 unit/integration tests passed. Type checking and lint passed. Aggregate domain branch coverage is 728/806 (90.32 percent), and compiler/uploader branch coverage is 97.01 percent. The unchanged per-file 80 percent gate passes. This does not prove complete product acceptance or physical safety; 50 lessons and other documented requirements remain.

Source changes are after published 0.4.0 and are not included in that immutable installer. Reports are retained in evidence/wip-toolchain-process-control.
