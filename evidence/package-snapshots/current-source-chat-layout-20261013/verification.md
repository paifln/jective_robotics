# Current-source contained chat workspace — local EXE

Snapshot: `.verification/current-source-chat-layout-20261013/win-unpacked/JECTIVE Robotics Studio.exe` (0.8.18, private unpacked verification build).

EXE SHA-256: `6a159026b86c537962a6916170a3ff2ec2e2f3a560b032de094558b4b40a7bb4`

ASAR SHA-256: `658a1bc51052d7ae3e673f7f08e5498ddcb79ceca527c99f6180a23f9e17c7dd`

Actual production EXE checks passed on Windows 11 build 10.0.26300:

- Startup and duplicate-instance behavior in an isolated profile.
- Production binary fuse configuration and equality of every built asset with packaged assets.
- Intentional ASAR tamper rejection followed by exact restoration.
- Encrypted dummy learner-token provisioning from environment and two genuine IPC/HTTP gateway requests to an explicit local fixture. No main inspector or IPC handler replacements.
- Student configure IPC denied. Immediate chat opening. No provider model in the outgoing gateway payload; selected source absent when sharing is off.
- Actual scene-coordinate edit persisted while retaining the existing line; JSON editor absent.
- Full theory open by default; repeated generic illustration absent. Actual ADC interactive output 4095.
- Long chat reply contained within its log at 1200x800 and 800x700; page height equals viewport height, composer remains visible, log scroll height 2916 pixels.
- Russian/Kazakh accessible names and ordinary Blockly-to-Learn pointer navigation at 800×700 in English, Russian and Kazakh.
- No observed renderer page errors or renderer HTTP requests in this bounded test. Main-process HTTP to the local fixture was intentional.
- EXE and ASAR hashes unchanged before/after UI verification.

Raw evidence: `package-verification.json` and `ui-smoke.json` in this directory. Source/domain/UI and gateway verification is scoped in `evidence/managed-assistant-design-20261013/verification.md`.

This is not a published installer. There was no clean installation/uninstallation, Windows 10 verification, live OpenAI request, deployed server/TLS verification, native compilation or physical hardware test on this snapshot. Published `release/JECTIVE Robotics Studio Setup 0.8.18.exe` remains unchanged and older. Do not transfer older snapshots' compiler results to this one.

Chat UI source evidence: `evidence/chat-workspace-20261013/verification.md`. The packaged test used temporary loopback Chrome diagnostics without main inspector, handler overrides or altered production fuses.
