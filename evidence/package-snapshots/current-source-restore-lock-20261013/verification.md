# Workspace restoration lock snapshot

Private unpacked Windows x64 0.8.18; published installer unchanged. Adds an exclusive IPC operation lifetime for workspace restoration and clears the old external document binding after success. Carries the earlier cancellation and lesson visibility changes.

Source typecheck, lint and build PASS. Two native source Electron tests PASS, including actual SQLite restoration, delayed native dialogs, lock release after cancellation, retained backup/snapshot metadata and byte-for-byte preservation of the old exported project. See `../../workspace-restore-lock-20261013/`.

Actual production EXE startup, duplicate-instance handling, seven fuses, packaged build asset equality and ASAR tamper rejection PASS (`package-verification.json`). Production UI smoke PASS (`ui-smoke.json`), including local gateway chat, encrypted learner credentials, localized navigation and scene persistence. No live provider requests or main handler overrides in packaged verification.

Windows 11 build 26300 only. Windows 10, physical ESP32, installer lifecycle and live hosted assistant are not verified by this snapshot. The previous 547-test domain baseline predates this main-process-only change; it is not represented as a fresh full-suite run here.
