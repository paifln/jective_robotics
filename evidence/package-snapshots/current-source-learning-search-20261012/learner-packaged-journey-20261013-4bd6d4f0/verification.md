# Actual packaged compiler journey - 2026-10-13

Unchanged production EXE and ASAR copied into an ordinary directory with spaces/Cyrillic. Isolated user profile and physically copied approved SDK also have spaces/Cyrillic; no links or user-data substitution. Temporary loopback Chromium diagnostics attach to the real jective://studio renderer. No main inspector, fuses, ASAR bytes or application handlers changed. Node require is absent in the tested renderer. Diagnostic/test processes were closed afterward; no JECTIVE/Arduino process remained at observation.

Actual UI enters Studio, converts Blocks to Code, edits through Monaco and invokes Compile:
- Invalidcf93f492-6a56-44df-a44c-c6686088f376: real missing_symbol_for_packaged_test diagnostic,exit1,no artifacts;152783ms.
- Corrected3ee39af9-e929-4e99-90f6-ed771329cb02: exit0,6fresh BIN/ELF artifacts; hashes independently verified;282945ms. SDK integrity digest before/accepted build is the original05d780d8394605ad310a76c978d1015bd0b80fcc80305f8c4d3852b23cfb5533.
- Both raw journals opened through actual packaged UI, all pages read through production preload/IPC and matched742/207byte original logs. No file-export dialog tested here.
- Committed source survived owned-process termination/relaunch and matched the editor. Read-only SQLite inspection proves different Blocks/Code IDs, preserved workspace equality and the original-block snapshot. Not forced termination during an in-flight autosave or migration-failure acceptance.
- EXE/ASAR hashes unchanged after execution. No external HTTP renderer requests observed; this is not an OS-disconnected/offline-network test of every process.

Original result.json is retained. Its checkedAt is start time; final receipt timestamp and cleanup observation are separately recorded in execution-metadata.json. Copied fixtures/artifacts remain in the ignored .verification/packaged-journey-20261013-4bd6d4f0 folder for inspection.

NOT RUN: upload/hardware/handshake, packaged stale-upload rejection with a real explicitly selected device, installed NSIS lifecycle, clean Windows10, complete simulation/classroom/content/localization/accessibility/scaling/declared performance journeys. This establishes packaged editor/compiler/committed-recovery behavior under Unicode paths, not full product acceptance.
