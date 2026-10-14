# Compiler journal UI verification

Implemented source: pure strict journal-page contract, in-session service-owned UUID/file registry (50 recent operations), checked filesystem paths,64KiB paged reads with splitUTF8 handling, byte-preserving filesystem export after native destination selection, expandable localized preview and sharing disclosure. Sandboxed preload imports only pure contracts; raw path/filesystem operations remain outside the renderer.

Passed evidence:
- npm run test:coverage: exit0,524tests/178files,96.31% package branch coverage and configured per-file thresholds.
- npm run typecheck / npm run lint / npm run build: exit0.
- Actual filesystem tests: long UTF8 roundtrip, exact byte-copy export, empty/malformed files, invalid offsets, escaping paths, redirected folders, nonfiles, unknown operation and cross-service rejection.
- Lifecycle test uses explicit fake CLI/artifacts: proves compile/upload journal registry/provenance wiring, not actual compilation/upload.
- Electron UI fixture: actual sandboxed preload, real unknown-operation rejection before replacing handlers, page forward/back and disabled states, keyboard opening, EN/RU/KK labels, export cancel response and malformed schema recovery. Not actual compiler/filesystem/native export acceptance by itself.

Initial actual GUI run18324 failed at the new export selector: a PowerShell-to-Node text encoding conversion turned the ellipsis into a question mark. Actual intentional compiler failure and native journal preview passed first; export was not invoked. Failure preserved in actual-gui-initial-selector-failure.json. Selector fixed to a stable anchored name pattern.

Rerun97053 PASSED,exit0,4.7minutes. Actual invalid build35d76bd2-1306-4410-9f92-e1875bf68eff exited1 with unknownPhase and no artifacts. Corrected eb524df8-91e3-4490-b91f-7f89ef106b8c exited0 with6fresh artifacts. All4source hashes and successful artifact hashes matched files; SDKdigest05d780d8394605ad310a76c978d1015bd0b80fcc80305f8c4d3852b23cfb5533. For each actual build, the test opened the UI preview, read all pages through production IPC and copied the log through the production native-export handler. Destination selection was a dialog test override, not a manual Windows dialog interaction. Export bytes and page text matched original709/207byte raw logs. Full editing, undo, source preservation, save, error navigation and800px light/dark checks passed too. Evidence: actual-gui-pass.json, actual-builds.json, failed-manifest.json, succeeded-manifest.json. No live job.


NOT RUN: updated packaged compiler journey, Windows10, installer lifecycle or physical hardware. Existing snapshots predate this source change. Integrity-failure/restarted-session journal UI and continuous output streaming remain unfinished.

Visual follow-up after the native compiler run found the expanded journal toolbar clipped by the220px output pane and bottom navigation at800x700. Before screenshots are preserved. CSS now expands output for an open journal and keeps page scrolling separate from the raw text scroll area. The dedicated Electron UI fixture rerun passed4.9s with an explicit assertion that all journal-toolbar controls lie above the bottom nav, no horizontal page overflow, and light/dark screenshots inspected. after-light.png/after-dark.png contain explicit test-response data; they do not prove actual compiler or hardware behavior. Compiler code unchanged by this presentation fix; the full native compiler run was not repeated for CSS alone.
