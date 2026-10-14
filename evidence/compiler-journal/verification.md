# Raw process journals

Source ToolchainService compile/upload calls write exclusive-create private raw journal files in their operation folder. Backpressure pauses both child pipes while the write stream drains; completion awaits flush. Screen/stdout/stderr tails remain bounded. A 64 MiB per-file quota cancels and rejects rather than silently dropping output. Build/upload manifests identify the log filename. Runtime raw files may contain local paths and source diagnostics; they are not automatically shared.

Verification performed:
- npx vitest run tests/toolchain-process.test.ts tests/toolchain-build-lifecycle.test.ts tests/source-snapshot.test.ts: exit 0,24 tests.
- npm run test:coverage: exit 0,520 tests/177 files,96.44% package branches, per-file thresholds passed.
- npm run typecheck / npm run lint / npm run build: exit 0.
- Actual child tests: full1.1MB preservation beyond1MB display tail, no overwrite, invalidUTF8 byte preservation, failed spawn journal closure,64MiB quota cancellation and subsequent command recovery.
- node .verification/compiler-journal-query.mjs: exit 0, actual installed CLI1.5.1/ESP32core3.3.12 version/core queries, version raw log equals captured output.
- node .verification/compiler-journal-electron-launch.mjs: exit 0, isolated Electron host with actual Node child, complete1.1MB journal and UTF8 checks. No user window changed.

NOT RUN for this change: actual compiler cycle, uploader, physical hardware, packaged compiler journey, Windows10, installer. Fixture lifecycle tests override child execution and do not prove those claims. Existing package snapshots predate this source change. In-app raw-log preview/export and live streaming remain incomplete; no full requirement acceptance claimed.
