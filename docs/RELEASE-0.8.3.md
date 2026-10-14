# 0.8.3 — Begin with robotics, then program

The default learning screen now starts with eight introductory lessons, F01–F08, in Russian, Kazakh and English. These explain useful robotics tasks, sensing/control/action/power, the difference between ESP32 and a JECTIVE carrier, USB/COM/GPIO/GND, safe experiments, connection planning, algorithms without code and a first independent project. Existing L01–L36 identifiers and project bindings retain their meanings. The introductory lessons are additional; they do not satisfy the remaining L37–L60 requirement.

The introduction uses selection, role matching, step ordering and a project reflection with explicit self-review criteria. Closed exercises are checked by shared pure domain logic; open reflection is stored as self-reported, never as a passed automatic assessment. After an attempt the student can open a hint; repeated attempts expose the explanation. Drafts and checked answers are saved by explicit buttons to the local SQLite workspace and survive reopening and validated backup/restore. Draft writes do not count as assessed attempts. Unsaved edits must be saved before switching lessons.

Real offline ESP32 photographs accompany the board lessons. Other introductory scenes explain delivery tasks, component roles, drivers, safety, algorithms and project testing. Animations respect reduced-motion preferences. The existing programming tasks retain their laboratories and checks; their redundant identical three-step instruction list has been removed.

The header now has Help, available from every workspace. It explains how to start, how blocks/code/compilation/simulation/USB differ, common failures, local data and optional AI use, and About JECTIVE. The website action opens only the constant `https://www.jective.kz/` in the system browser. The renderer receives no general-purpose URL opener. The privacy page describes application behavior; it does not invent a legal entity or claim legal certification.

Studio exposes Circuit → Program → Test without a board. The Circuit workspace has signal selection, clickable GPIO assignments, alternative select controls, capability restrictions, conflict reporting and disconnection. Both connection views use the same project update function, regenerate block source and invalidate the previous compilation. This is a logical connection plan, not automatic wire detection or an electrically accurate circuit simulator. It does not reproduce the unknown physical JECTIVE carrier layout. Motors remain simulator-only in the integrated application. The preserved Blockly/Monaco editors are hidden rather than destroyed when switching workspace views. Small-screen navigation is layered above the Blockly toolbox.

## Architecture and data compatibility

- `learning-activities.ts`: bounded answer schema and pure grading for five activity types.
- `foundations.ts`: translated educational content, separate from renderer controls.
- `learning-records.ts`: validated lesson identifiers, records and server-calculated attempt/state updates.
- `student-help.ts`: translated documentation and policy text, separate from the dialog UI.
- `WorkspaceStore`: prepared SQLite queries; records use validated `learning:F01`–`learning:F08` settings keys. Existing seven-table schema and user version 1 remain compatible. Backup inspection accepts only validated new records and still rejects arbitrary settings/tables.
- Typed preload IPC retains the main-window/main-frame origin guard and result validation. External-site access is fixed to the JECTIVE domain.
- `FoundationCourse`, `FoundationVisual`, `CircuitPins` and `HelpMenu` are independently maintained UI modules.

## Verification and limits

See `evidence/learning-workspace` for final receipts. The host is Windows 11, build 26200. Windows 10 acceptance, actual installation/uninstallation and physical ESP32/JECTIVE upload/wiring verification require separate tests. No physical board was available. The installer is unsigned; no code-signing certificate was available.

Final checks: typecheck/lint/build pass; 316 unit/integration tests pass; package branch coverage is 96.13% with the per-file 80% gate; five targeted source Electron scenarios pass with zero skips/flakes, including real ESP32 compilation and invalid-source rejection. The entire legacy Electron suite was not run or migrated in this revision. Dependency audit reports zero known vulnerabilities. The packaged binary passes fuse checks, equality with the tested build, renderer IPC startup, duplicate-instance rejection and an intentional ASAR tamper test (exit 1 with an integrity diagnostic); the original archive is restored and verified afterward. No installation or physical upload is implied by these results.

Public installer: `release/JECTIVE Robotics Studio Setup 0.8.3.exe`, 151,763,352 bytes, SHA-256 `95abcf5567702528d039c4f1e590580f599382dbea33e97badd894112dfa13aa`, Authenticode `NotSigned`. Earlier internal 0.8.3 QA checkpoints are retained under `.verification`; they are not the public final artifact. The previously published 0.8.2 installer hash remains unchanged.

The overall 60-lesson content validator still reports NOT COMPLETE: L37–L60 and independent technical language review remain outstanding. Historical preview installers and their scope have not been replaced. This release is an educational development preview, not a claim that every original master-prompt requirement is complete.

### Acceptance steps requiring another environment or physical equipment

1. On a clean Windows 10 x64 standard-user account, record the OS build and installer hash, install to the default and a custom path, then start without development tools or administrator privileges. Check the splash/logo, all three languages, offline lessons/photos, project save/recovery and settings. Install/uninstall acceptance has not been performed on this host either.
2. Check a clean upgrade from the previous preview using a copy of a real workspace. Reopen old projects and snapshots, save introductory answers, back up and restore into an isolated workspace. Uninstall and verify that educational data is retained as configured. Keep the original workspace backup throughout.
3. Identify the exact ESP32 module, JECTIVE carrier revision and manufacturer pin/voltage documentation. Do not substitute the generic development-board photo for those documents. A provisional/unidentified carrier must remain blocked for physical upload.
4. Connect a verified data USB cable. Observe the actual port appearing/disappearing on plug/unplug; check that an unrelated port is not selected. With power disconnected, check the intended low-risk indicator circuit, current-limiting resistor and polarity against the real hardware documentation.
5. Compile the supported indicator project, upload only to the identified board after confirming the target, and observe its physical output. Record the board revision, port, firmware hash and outcome. Check cable removal, a busy serial port and an interrupted upload without treating a build or simulated output as physical evidence. Motor/sensor hardware support requires separate integration and supervised acceptance.
