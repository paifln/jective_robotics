# Project-owned simulation worlds — source only

Projects now optionally store a validated simulationWorld. Existing projects without it remain valid. Applying a designer area, opening a world file, selecting a map or changing the simulated button records the resulting world in the current project and marks it unsaved. The existing recovery autosave and explicit project save retain it. Returning to the simulator uses the project's world before a lesson's default area. A simulation is not resumed automatically.

The shared world schema was moved into world-schema.ts, independently of the simulation engine. Project validation, world-file validation and simulator validation use the same geometry and bounds. The public simulator module retains its schema exports. The new project field is distinct from source code: changing a world does not compile, upload or alter firmware files.

Verification: 378 passing tests across 123 files, 96.31% branch coverage with unchanged per-file gates, typecheck, lint and build. Durability checks cover disk save/open, portable project archives, deep independent copies, recovery, snapshots and SQLite backup/restore. Five final Electron scenarios cover Studio, designer, file opening and project save/open, plus the existing student journey and real successful/failed ESP32 compilation. [Evidence](../evidence/project-world/verification.json).

This increment is not in the immutable 0.8.9 installer. L43 lesson registration and adaptive tasks remain; source curriculum is still 42/60. Physical upload, Windows 10, clean installation/uninstallation and live OpenAI were not verified. Older software versions with strict project schemas cannot open projects using the new optional field; retain the current version when sharing those projects.
