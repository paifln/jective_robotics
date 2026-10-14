# Current source UI-recovery package — 2026-10-13

Subsequent known finding: its archived CSS retains an English landmark selector, which prevents the intended navigation stacking rule after RU/KK localization at narrow width. Actual source test found Blockly intercepting navigation. This snapshot remains immutable; the defect is corrected and actual EXE interaction verified in [the newer study-flow snapshot](../current-source-study-flow-20261013/verification.md). Earlier narrow smoke results below do not cover that interaction.

Built a separate unpacked Windows x64 production snapshot at `.verification/current-source-ui-recovery-20261013/win-unpacked/JECTIVE Robotics Studio.exe`. Production `package.json.build` configuration is copied with only the output directory changed. Electron 44.7.0 / electron-builder 26.15.3, actual host Windows_NT 10.0.26300. Version remains 0.8.18; this is a local verification snapshot, not a newly published release or installer. A future distribution must use a new release version.

Includes current configuration serialization/error recovery, project action lifecycle, lesson illustration keys and restored interactive visuals, and localized accessible controls/stable navigation CSS. The 0.8.18 published NSIS installer was not changed; its SHA256 is still `8de7b4fddb70c34d21e8eaee78c257ba618618cf69a84a3d8935d1bf3f480897`.

Production security/package checks passed (`package-verification.json`): seven enforced fuse settings, all 273 built asset byte hashes and bundled CLI equality, actual renderer/workspace initialization in 1821 ms, duplicate instance exit with first instance retained, intentional one-byte ASAR modification rejected by integrity enforcement, and original archive restored. This one warm/local startup is not the required five-run cold baseline performance test.

Actual packaged worker and serialport module loaded under a matching external Electron diagnostic host (`worker-asar.json`): four-file spaces/Cyrillic fixture matched expected content digest, same-size preserved-mtime change detected, missing file rejected; OS enumerated two serial ports, none opened. This is module/worker loading evidence, not compilation/upload or physical readiness.

Actual protected EXE renderer smoke passed (`ui-smoke.json`) with a temporary loopback Chrome diagnostics port and isolated profile. No main-process inspector, fuse changes, ASAR mutation or IPC handler overrides. L01→L15→L14 retained one illustration; actual ADC slider reached 4095. Seven concurrent production configure IPC requests with an explicit dummy key completed in order, preserved the encrypted key during model-only changes and left no dummy plaintext in assistant.json; dummy key was subsequently removed. Russian/Kazakh navigation, sound and numeric-answer accessible names were found. No observed pageerror or renderer HTTP request. Other processes/OS network adapters were not instrumented or disconnected, and no live provider request was made.

EXE SHA256: `0cce379c56f28a244161cae82dc68b7e4d337b675be6564ded3bff3bcf558a1f`.

ASAR SHA256: `ece69415afd72a29836dc7835c0e9369de5d084952d71d8755fc3db1ee27a074`.

Both hashes remained identical after UI smoke. Only captured owned test processes and temporary profiles were stopped/removed. User preview PID 8928 was independently observed still present with its application window; it uses the previous snapshot. No automatic replacement/restart of that preview was performed.

Actual current-snapshot compiler and restart journey subsequently passed under ordinary spaces/Cyrillic application/profile/copied SDK paths. Missing-symbol code exited 1 without artifacts; corrected code exited 0 with six hashed files; packaged journal UI/IPC matched raw logs, saved source recovered after restart and original Blocks workspace/snapshot was retained. See [scoped compiler verification](learner-ui-recovery-journey-20261013-3d7530c7/verification.md). This is new execution evidence for this exact snapshot, independently of the earlier package.

NOT RUN/incomplete: new NSIS generation/lifecycle, code signing, clean Windows 10, full packaged learner acceptance and compiler matrix, stale-upload rejection with selected hardware, physical ESP32/Jective board, runtime handshake/safe motor observation and configured live model.
