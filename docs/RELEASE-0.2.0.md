# Development build 0.2.0 — 2026-10-10

This build expands the original indicator/compiler slice into usable project, simulation, device and classroom workflows. It is **not the complete master-prompt product or a hardware-ready release**.

Implemented: 13 Blockly block types and shared typed IR, variables/logic/repeats, independent Monaco Code mode, actual compiler diagnostics and artifact freshness, ESP32 and ESP32-C3 reference profiles, unassigned JECTIVE, pin validation and two reviewed motor adapter configurations, real port enumeration and bounded serial monitoring, explicit real CLI upload of a matching successful build, six interactive worker-based worlds, configurable geometry/seeded distance noise, SQLite recovery and named snapshots, safe project/classroom archives, offline assignment/submission/grading/CSV workflows, workspace backup validation, optional encrypted-key AI with context preview and reviewed Monaco diffs, two trilingual lessons, eight guides and searchable manual.

Verified: 25 domain/integration tests, TypeScript/lint, five installed-EXE scenarios including actual valid/invalid compilation, C++ host safety logic, runtime compilation for both board families, ten-repeat deterministic trajectories, five learner/two assignment exchanges and a copied hash-verified offline toolchain compile. NSIS installed locally in a per-user Cyrillic/spaces path on Windows 11 build 26200. See lifecycle evidence for exact uninstall/reinstall outcomes. npm audit reports zero known findings.

Outstanding: 58 substantive lessons; teacher language review; fully localized blocks/dialogs/errors and explanatory UI; cooperative hardware generator/runtime integration; approved sensor/servo/buzzer/encoder drivers and host movement/session integration; profile import/migration; broader fault coverage, diagnostic navigation acceptance, accessibility/scaling/performance and measured branch coverage; clean Windows 10/11 standard-user/disconnected acceptance; signing and final license/distribution review.

Hardware observations are NOT RUN. No board was identified. COM3/COM4 were Bluetooth ports. No automatic port opening, upload or motor arming occurred. Experimental safety code is not a physical safety certificate. Unknown pin maps remain blocking and arbitrary edited C++ is not simulated.

The unsigned installer uses the default Electron icon. Arduino CLI is bundled, the 1.25 GB offline ESP32 package archive is separate. Toolchain import requires approximately 6.88 GB plus build and previous-copy space. The GUI has improved EN/RU/KK controls, but some prose and blocks are still English. Content audit intentionally fails rather than counting missing lessons as complete.

Native rebuild required unavailable Visual Studio. Packaging intentionally retains serialport's Windows x64 Node-API prebuild and verifies its actual loading in installed Electron. Failed packaging/test attempts are retained as failures.
