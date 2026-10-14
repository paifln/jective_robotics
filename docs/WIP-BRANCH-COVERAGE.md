# Domain branch coverage

Source now pins `@vitest/coverage-v8` 5.0.3 to match Vitest. `npm run test:coverage` measures every TypeScript file under packages, including unimported files, and requires at least 80 percent branch coverage per file. `release:verify` includes this gate. Configuration follows the [Vitest coverage guide](https://vitest.dev/guide/coverage.html); coverage is a backstop and does not replace meaningful safety-transition or physical tests.

The first observed baseline was 588/793 branches, 74.14 percent. Adding assistant boundary tests increased the measured result to 641/793, 80.83 percent overall. The assistant module covers 53/56 branches, 94.64 percent. Seven modules still fail the per-file gate: device lifecycle/log/telemetry, project files/workspace and offline bundle/toolchain services. The command correctly exits nonzero; this is not coverage acceptance.

New assistant tests use actual loopback HTTP requests with an explicit test provider and test-only credentials. They exercise disabled defaults, destination restrictions, configuration corruption, credential preservation/clearing, secure-storage unavailability, supplied-context boundaries, HTTP failure, forbidden redirects, malformed/oversized replies, concurrency, cancellation and recovery. Electron safeStorage is replaced by an explicitly labeled test adapter; these tests make no DPAPI or encryption-strength claim. Installed application checks from 0.4.0 remain separate evidence.

These are source changes after the published 0.4.0 installer and source ZIP. Those immutable artifacts retain their earlier dependency set and test command configuration. The full master specification remains NOT COMPLETE.
