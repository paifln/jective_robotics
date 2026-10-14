# 0.8.9 — complete code files, safe assistant review and L42

Studio now edits real separate source files with independent undo/view state and navigates compiler messages to the correct file and line. Complete code bundles survive project copies, saving, backup, portable archives and Arduino-folder export. File names, size limits and upload reuse are validated across the whole source set. Student assistant sharing targets one selected file; explicit review rejects stale source/project/hardware changes and never compiles or uploads automatically.

L42 adds substantive EN/RU/KK source-structure theory, a four-file task with a real injected helper error, durable adaptive file-responsibility matching, boundary prediction and report export. Source and packaged curriculum now contain **42/60 draft lessons**. The example prints text and does not assign GPIO or drive motors.

The installer is [JECTIVE Robotics Studio Setup 0.8.9.exe](../release/JECTIVE%20Robotics%20Studio%20Setup%200.8.9.exe), **151,983,551 bytes**, SHA-256 `46b8ab5d905b327f78516b4ad5f290ba4f311e8c8e7d10f02b65bb75ada2055f`. Authenticode status: **NotSigned**. Earlier installers are retained unchanged.

Verified evidence:

- 368 domain/unit/integration tests across 120 files; 96.29% branch coverage with the unchanged per-file 80% gate. Type checking, lint and build pass.
- Seven targeted source Electron scenarios, plus a later L42 portable-export scenario: real ESP32 failure/correction/success, exact file diagnostics, saved source sets, complete Arduino and `.jective` exports, reference independence, downloaded prediction report, durable assessment, both themes at 800px, all 42 introductions, sidebar/activity, board wizard and assistant review. These are targeted scenarios, not a claim that every legacy E2E passes.
- Refreshed separate-file native host execution with clock/Serial substitutes and enabled assertions; actual ESP32 good/error/export-directory compiles. Stale upload reuse is rejected before CLI. The autonomous verifier now additionally forbids any uploader invocation and empirically probes that guard.
- Production and full dependency audits report zero known vulnerabilities at verification time.
- Packaged startup/workspace IPC, second-instance rejection, binary fuses, exact dist/packaged asset equality and bundled CLI equality pass on Windows 11 build 26200. A one-byte ASAR mutation is rejected with an integrity diagnostic; the archive is restored and its hash checked. Startup is not installer lifecycle acceptance.

Receipts: `evidence/releases/0.8.9`, `evidence/multifile-lesson`, `evidence/assistant-file-review` and current `evidence/multifile/compiler.json`. Source UI was tested before the version metadata bump; packaged checks verify the resulting 0.8.9 files and actual startup separately. Assistant responses in the UI verification are delayed test fixtures, not live OpenAI calls.

Remaining: L43–L60 (18 lessons), independent technical language review and the remaining master-prompt acceptance requirements. The full curriculum gate intentionally remains NOT COMPLETE. Physical ESP32/JECTIVE execution, real motor/sensor behavior, Windows 10, clean installation/uninstallation and live OpenAI are NOT RUN. This release is a verified increment, not completion of the entire objective.
