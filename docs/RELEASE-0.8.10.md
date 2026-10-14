# JECTIVE Robotics Studio 0.8.10

This release packages the visual practice-area designer, direct world-file opening/saving, validated project-owned simulation worlds and registered L43 coordinate learning. The course now contains 43/60 draft EN/RU/KK lessons.

Students can change robot/goal/obstacle geometry, inspect a pixel preview and fixed-step pose prediction, export labelled world JSON and reopen it without pasting technical JSON. Invalid or oversized files preserve the active area; a superseded read cannot replace a later map selection. Applying a world stops the current run. Project save/open, portable archive, recovery, independent copy, snapshots and SQLite backup retain the world.

L43 includes substantive trilingual theory, a coordinate SVG, checked pose/unit matching with persisted attempts, world design/export and starter/reference block programs. Both programs execute collision-free in their authored world and finish at different poses. Predictions, actual simulation, compiler results and physical verification remain separate.

Verification: 382 tests across 125 files, 96.31% branch coverage with unchanged per-file thresholds. Typecheck, lint and build pass. Five final source Electron scenarios plus an earlier targeted L43 scenario pass, including actual good/bad ESP32 compilation. These source scenarios preceded the version metadata bump; the new package separately passed actual Windows 11 startup, workspace IPC, single-instance, binary fuse, asset/CLI equality and intentional ASAR tamper rejection checks. The original archive was restored and its hash checked. Full and production dependency audits reported zero known vulnerabilities.

Installer: [JECTIVE Robotics Studio Setup 0.8.10.exe](../release/JECTIVE%20Robotics%20Studio%20Setup%200.8.10.exe), 151,981,436 bytes. SHA256: `0cb46605c9be8661bb152c670d0de61575447b03044510d3ca51844a293e1414`. Authenticode status: NotSigned. Previous 0.8.9 installer is unchanged.

Not verified: clean installation/uninstallation, Windows 10, physical ESP32/JECTIVE upload and motors/sensors, or live OpenAI. L44–L60, independent technical language review and remaining master-prompt acceptance remain incomplete. Projects using simulationWorld require this version or another version supporting that field. [Verification receipt](../evidence/releases/0.8.10/verification.json).
