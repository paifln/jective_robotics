# Current-source managed chat r3 — local EXE

Snapshot: `.verification/current-source-managed-chat-r3-20261013/win-unpacked/JECTIVE Robotics Studio.exe` (0.8.18, private unpacked verification build).

EXE SHA-256: `e7727cbdecee395d56ef2867bacee5ec60870538fcc6ccaf4bc66edf91cd9176`

ASAR SHA-256: `440f444302c436bfadfed7f129ea9c7a42b40249ecc31a20b4910a471174e73f`

Actual production EXE checks passed on Windows 11 build 10.0.26300:

- Startup and duplicate-instance behavior in an isolated profile.
- Production binary fuse configuration and equality of every built asset with packaged assets.
- Intentional ASAR tamper rejection followed by exact restoration.
- Encrypted dummy learner-token provisioning from environment and genuine IPC/HTTP gateway request to an explicit local fixture. No main inspector or IPC handler replacements.
- Student configure IPC denied. Immediate chat opening. No provider model in the outgoing gateway payload; selected source absent when sharing is off.
- Actual scene-coordinate edit persisted while retaining the existing line; JSON editor absent.
- Full theory open by default; repeated generic illustration absent. Actual ADC interactive output 4095.
- Russian/Kazakh accessible names and ordinary Blockly-to-Learn pointer navigation at 800×700 in English, Russian and Kazakh.
- No observed renderer page errors or renderer HTTP requests in this bounded test. Main-process HTTP to the local fixture was intentional.
- EXE and ASAR hashes unchanged before/after UI verification.

Raw evidence: `package-verification.json` and `ui-smoke.json` in this directory. Source/domain/UI and gateway verification is scoped in `evidence/managed-assistant-design-20261013/verification.md`.

This is not a published installer. There was no clean installation/uninstallation, Windows 10 verification, live OpenAI request, deployed server/TLS verification, native compilation or physical hardware test on this snapshot. Published `release/JECTIVE Robotics Studio Setup 0.8.18.exe` remains unchanged and older. Do not transfer older snapshots' compiler results to this one.
