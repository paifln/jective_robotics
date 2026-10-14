# Current source study-flow snapshot — 2026-10-13

New unpacked production EXE: `.verification/current-source-study-flow-20261013/win-unpacked/JECTIVE Robotics Studio.exe`. Version0.8.18 remains a local verification snapshot, not a new published release. Copied package.json production build configuration with only output directory changed. Includes navigation stacking correction and the recent request-preview/status/error/token-bound assistant improvements. Older snapshots and published NSIS installer were not overwritten.

Actual Windows_NT 10.0.26300 / Electron44.7.0 / builder26.15.3. Package/security check PASS (`package-verification.json`): production fuses, all built asset/CLI equality, actual startup/workspace IPC, duplicate-instance isolation and intentional ASAR tamper rejection/restoration. Actual protected EXE UI PASS (`ui-smoke.json`), temporary loopback Chrome diagnostics and isolated profile: L01/L15/L14 one illustration, real ADC4095, seven concurrent dummy-key settings writes with encrypted-key retention, RU/KK accessible names, and normal Blockly→Learn pointer navigation at800×700 in EN/RU/KK. No main inspector, handler overrides or changed fuses; no observed renderer HTTP request/pageerror. EXE/ASAR hashes identical before/after.

Packaged worker and serialport module load/content fixture PASS through matching external diagnostic Electron host (`worker-asar.json`): same-size preserved-mtime modification detected/missing rejected, four-file Unicode fixture correct, OS enumerated two ports but none opened. This is not a compiler/upload or physical test.

Read-only archived CSS comparison confirms the old UI-recovery package retained the English-label selector and this package does not (`css-selector-comparison.json`). Initial extraction attempt used POSIX archive separators and failed to find the entry; corrected to native Windows separators, no archive modification. Old package navigation verification was narrower and did not prove this interaction.

EXE SHA256: `4a3360c9da7ed230277e2b12dc1faeeda9c33eefe9fadc527804fe97e77e99b0`.

ASAR SHA256: `22dd1a6d1a64c031905304a0bd8ad3fad31fd252db8fb7f4cf3acf9b2f7d13b2`.

NOT RUN/incomplete: current-snapshot real compiler/selected stale-upload regression, full packaged learner journey, NSIS generation/lifecycle/signing, clean Windows10, OS-disconnected baseline, all GUI/content/human translation/accessibility and physical board/runtime/motor safety. Earlier real compiler execution belongs to the separately hashed UI-recovery package and is not transferred to this snapshot. Source protocol/provider fixtures are not live OpenAI verification. User preview PID8928 observed responding and left on its older snapshot.
