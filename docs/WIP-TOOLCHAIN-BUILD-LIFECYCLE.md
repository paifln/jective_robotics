# Compiler and upload lifecycle

Upload now requires a successful manifest containing both sketch.ino.bin and sketch.ino.elf, unique artifact names and SHA-256 formatted hashes. Empty, incomplete and duplicate artifact lists are rejected before invoking upload; path traversal names and altered artifact bytes are also rejected. A CLI upload that terminates without an exit code is classified as interrupted, consistently with compilation.

Five new lifecycle tests use explicit simulated CLI replies with actual temporary sketch, artifact and manifest files. They cover provisional wiring, CLI/core version mismatch, missing core, failed or malformed core queries, successful compilation, source changes, artifact tampering, failed/incomplete/interrupted rebuild invalidation, and upload success/failure/interruption without implicit compilation. Upload records continue to state physical and handshake NOT RUN. These fixtures do not claim actual hardware upload.

All 88 unit/integration tests passed. The unchanged per-file 80 percent branch coverage gate now passes for every included domain module: compiler/uploader 85.71 percent and aggregate 717/802 (89.40 percent). Type checking and lint passed. Coverage does not establish full product acceptance; renderer accessibility, all 60 lessons and physical verification remain separate requirements.

Changes are in source after published 0.4.0 and have not been packaged into that installer.

The targeted source Electron compiler scenario also passed with the real pinned Arduino CLI and ESP32 core: valid source compiled successfully and deliberately invalid source failed with its diagnostic visible in the UI (47.4 seconds for the scenario run). This is actual compilation evidence, not an upload or physical-device test. Its report is retained in evidence/wip-toolchain-build-lifecycle/e2e.json.
