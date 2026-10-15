# Actual packaged compiler journey — 15 October 2026

PASS for the private Windows-shell snapshot, under ordinary copied SDK/package/profile paths with spaces and Cyrillic. No main inspector, handler override or modified fuse. Both EXE and ASAR matched the source private package before copy and after the journey. Renderer had no Node require access; no renderer HTTP request observed.

| State | Operation | CLI exit | Observed ms | Artifacts |
| --- | --- | --- | --- | --- |
| failed | e97a49bf-d699-4bcf-b298-7a25443dd849 | 1 | 168813 | 0 |
| succeeded | 7ec66acb-e8e4-4ae1-98f6-9dd72f48fc03 | 0 | 338246 | 6 |

The first fixture deliberately refers to a missing symbol and fails. The corrected fixture contains Arduino.h, empty setup and empty loop and succeeds. The real compiler manifests, full raw logs and all output hashes were checked. Paged journal text equals raw UTF-8 log. Corrected source survived an actual application restart.

This proves only these two minimal programs in this artifact and approved reference ESP32 SDK on the current development host. It does not prove all course programs, future JECTIVE hardware, Windows10, installer lifecycle or upload. No physical port was opened and no firmware uploaded. The newer root source adds a dirty-import confirmation and board-profile refresh handling after this snapshot; these results are not automatically transferred to a later r2 binary.

Source report is locally retained as result.json alongside failed-manifest.json and succeeded-manifest.json in this directory. Fixture SDK/app/profile are retained under .verification/windows-shell-compiler-20261015-1dbe3777. No timestamp-only environment cache or reduced integrity check was introduced.
