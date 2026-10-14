# Current-source managed chat r2 — local EXE

Snapshot: `.verification/current-source-managed-chat-r2-20261013/win-unpacked/JECTIVE Robotics Studio.exe` (0.8.18, private unpacked verification build).

EXE SHA-256: `8a3a625535127f676e8837b8d94e3ddad59b8b318e9598d4f79ee8b8ff90f546`

ASAR SHA-256: `9b83305ea007d6422fe3d4463281217c3090b43e7996c5f9f8603ab6f18974b6`

Actual production EXE checks passed on Windows 11 build 10.0.26300:

- Startup and duplicate-instance behavior in an isolated profile.
- Production binary fuse configuration and equality of every built asset with packaged assets.
- Intentional ASAR tamper rejection followed by exact restoration.
- Encrypted dummy learner-token provisioning from environment and genuine IPC/HTTP gateway request to an explicit local fixture. No main inspector or IPC handler replacements.
- Student configure IPC denied. Immediate chat opening. No provider model in the outgoing gateway payload; selected source absent when sharing is off.
- Full theory open by default; repeated generic illustration absent. Actual ADC interactive output 4095.
- Russian/Kazakh accessible names and ordinary Blockly-to-Learn pointer navigation at 800×700 in English, Russian and Kazakh.
- No observed renderer page errors or renderer HTTP requests in this bounded test. Main-process HTTP to the local fixture was intentional.
- EXE and ASAR hashes unchanged before/after UI verification.

Raw evidence: `package-verification.json` and `ui-smoke.json` in this directory. Source/domain/UI and gateway verification is scoped in `evidence/managed-assistant-design-20261013/verification.md`.

This is not a published installer. There was no clean installation/uninstallation, Windows 10 verification, live OpenAI request, deployed server/TLS verification, native compilation or physical hardware test on this snapshot. Published `release/JECTIVE Robotics Studio Setup 0.8.18.exe` remains unchanged and older. Do not transfer older snapshots' compiler results to this one.

Superseded by r3: this earlier snapshot placed the switch photo in L05 and lacked the selected-scene form controls. Use r3 for the corrected placement and visual scene adjustments.
