# Editor stacking snapshot

Private unpacked Windows x64 0.8.18 includes isolated editor stacking; published installer unchanged.

Production startup, duplicate-instance handling, seven fuses, all packaged build asset equality and ASAR tamper rejection PASS (`package-verification.json`). Actual production UI smoke PASS (`ui-smoke.json`) using an isolated profile, local gateway fixture and loopback Chromium diagnostics. No main inspector, handler overrides, real provider or hardware requests.

Two source Electron regressions PASS: multi-file assistant review preserving source/consent/project identity, and localized Studio board-run/code-copy workflows. See `../../studio-save-journey-20261013/` for the separate ordinary Save/Open/conflict and header hit-test proof.

Actual packaged invalid/fixed compiler and committed-source restart verification finished FAIL after the observation deadline while corrected-code post-compile integrity checks were pending. The invalid-code result is verified; final corrected-code and restart acceptance remain unverified. The retained report is `learner-ui-recovery-journey-20261013-2c9c626d/result.json`; it uses a separate copied approved SDK and application/profile paths with Cyrillic and spaces. Do not infer its result from earlier snapshots or from the existence of this report.

Windows 11 build 26300. Windows 10, installer lifecycle, physical ESP32 and live server deployment remain unverified.
