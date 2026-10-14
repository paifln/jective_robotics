# JECTIVE Robotics Studio 0.8.11

This release packages L44 repeatable experiments: substantive EN/RU/KK theory, checked controlled-condition selection, starter/reference block algorithms and a responsive worker comparison panel. Students compare two stopping thresholds with shared geometry, robot settings, seeds and fixed 20 ms steps. Replays match exactly; changed-seed and zero-noise controls are reported from actual traces. Validated exports preserve world/program snapshots, units and raw states. Parameter changes invalidate old results; cancellation, stale replies and timeout restore control.

Verification: 392 tests across 130 files; 96.33% branch coverage with unchanged per-file gates; typecheck, lint and build pass. Five source compatibility scenarios preceded a field-layout correction; targeted L44 passed after it. Light/dark 800px views were inspected. Actual delayed/withheld worker fixtures verified cancellation, superseded responses and timeout. Source scenarios preceded the version metadata bump.

The package passed actual Windows 11 startup/workspace IPC, duplicate-instance, binary fuse, asset/CLI equality and ASAR tamper rejection/restoration checks. Equality now explicitly includes all three simulator/experiment workers. Full and production audits reported zero known vulnerabilities. These checks do not prove the complete packaged learner workflow, clean installation/uninstallation, Windows 10, physical hardware or live OpenAI; those remain unverified.

Installer: [JECTIVE Robotics Studio Setup 0.8.11.exe](../release/JECTIVE%20Robotics%20Studio%20Setup%200.8.11.exe), 151,999,633 bytes. SHA256: `d680a3cac0013d89424181d6860a3b020ab8afb1ce438a4930fa32d3c0de9a19`. Authenticode: NotSigned. Published 0.8.10 remains unchanged.

Course status: 44/60 draft lessons. L45–L60, independent technical language review and remaining master-prompt acceptance are incomplete. [Evidence](../evidence/releases/0.8.11/verification.json).
