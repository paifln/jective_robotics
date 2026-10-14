Current release **0.8.18** adds responsible AI review, capstone planning and integrated prototype lessons. **56/60 draft lessons**; 476 tests pass. Remaining content/review/acceptance is incomplete. See [release scope](docs/RELEASE-0.8.18.md).

Published 0.8.10 contains the current world and L43 features. Earlier work-in-progress evidence records its original source-only scope.

Current 0.8.8 includes L40 nonblocking time and L41 bounded collections with actual native C++/ESP32 checks, adaptive persisted exercises and honest model reports. Curriculum: 41/60. See [scope and evidence](docs/RELEASE-0.8.8.md).

0.8.7 adds L39 function interfaces and source-matched real-API teaching examples. Earlier assert-based native C++ verification is corrected and rerun; see [assertion evidence correction](docs/ASSERTION-CORRECTION.md) and [release scope](docs/RELEASE-0.8.7.md).

The 0.8.7 firmware/interface source hardens initialization and task ownership and includes the registered L39 real-API lesson. Physical runtime acceptance remains incomplete. See [runtime interface scope and limits](docs/RUNTIME-INTERFACE-WIP.md).

0.8.6 adds the trilingual L38 types/scope lesson, actual C++ boundary checks, text-only Studio tasks and an atomic project-copy command. See [scope and verification limits](docs/RELEASE-0.8.6.md).

0.8.5 adds the trilingual L37 blocks-to-code lesson, actual generated-line mapping, checked adaptive exercises and mapping report export. It also updates the student manual and removes redundant Studio heading instructions. See [release scope and limits](docs/RELEASE-0.8.5.md).

0.8.4 simplifies Studio, adds direct USB board upload, an icon-only collapsible sidebar and a saved-program activity calendar, expands the simulator to 12 fields, and separates OpenAI setup from student chat. See [release scope and verification limits](docs/RELEASE-0.8.4.md).

0.8.3 adds an eight-lesson robotics introduction before programming, varied introductory exercises with local answer storage, top Help/About/privacy pages, and a clickable Studio circuit workspace. See [release scope and verification limits](docs/RELEASE-0.8.3.md).

# JECTIVE Robotics Studio

Windows x64 Electron robotics IDE, development build **0.8.8**. The master prompt is preserved in `MASTER_PROMPT.txt`. **The complete product is not finished and this is not a hardware-ready release.**

Current source follows the newer student-first request: Lessons → My projects → Studio → Simulator → My board, with the student assistant at the bottom and documentation Help in the header. The local classroom UI has been removed. All 41 authored lessons now have short EN/RU/KK explanations and actionable tasks, twelve kinds of interactive illustrations, optional deeper theory, and automatically checked practice. Studio uses a larger editor and icon commands with accessible tooltips. Run on board opens compact USB selection, compilation and upload inside Studio. The simulator runs the current blocks directly across 12 fields; testing tools remain in expandable details. Fresh installations start in Russian; explicit saved language preferences are retained. 0.8.2 additionally bundles real board/LED/distance-sensor photographs and hardens local resource policy, IPC, hardware-operation locking, single-instance startup and packaged Electron fuses. See [0.8.2 scope and verification](docs/RELEASE-0.8.2.md). These changes are not in the historical 0.8.1 installer.

See [student experience source work](docs/STUDENT-EXPERIENCE-WIP.md) for the redesigned modules, verification scope and remaining hardware limits.

0.8.1 adds branded installer/uninstaller pages, the executable Jective icon and logo-bearing native confirmation windows. Four targeted installed-app scenarios pass, including actual compilation. See [branding release](docs/RELEASE-0.8.1.md).

The 0.8.2 development preview includes L24 calibrated square route, L25 obstacle stop, L26 obstacle avoidance states L27 line sensor calibration L28 two-sensor line following L29 proportional line control L30 combined course priorities L31 encoder counting L32 wheel-speed feedback L33 bounded PID comparisons L34 limited servo mechanisms L35 orientation estimates and L36 precision motion comparisons, bringing the curriculum to **36/60** draft trilingual lessons. The L24 laboratory records repeated endpoint errors and per-side/turn observations with a learner-justified revision. Published 0.8.1 installer/source archives retain their original 23-lesson scope. See [current L24 scope](docs/SQUARE-ROUTE-WIP.md).

0.8.0 adds a pixel robot game world, real program/collision/finish checks and a Studio components dock with icons, GPIO assignments and serial port state. It packages L18–L23 dashboards, inspection and motor experiments: **23/60** draft trilingual lessons. See [release scope](docs/RELEASE-0.8.0.md) and [design](docs/DESIGN-0.8.0.md). 203 unit/integration tests and all 47 final installed Electron scenarios pass, including actual compilation, with no skips or flakes.

The application has real Blockly/Monaco editors, independent Blocks-to-Code copies, actual Arduino CLI builds and artifact validation, real serial enumeration/monitoring and a guarded uploader, three bundled board profiles including unassigned JECTIVE plus versioned custom-profile exchange and project binding, a logical pin validator, twelve interactive robot worlds, transactional SQLite projects/recovery/snapshots, portable archives, offline learning hints and an optional encrypted-key AI provider with reviewed diffs, 41 draft EN/KK/RU lessons, eight assembly guides and a searchable offline manual. Legacy classroom storage is retained for existing data but has no student-facing screen.

Remaining major requirements: **19 lessons**, independent language review, integrated cooperative hardware code generation and additional sensor/actuator adapters, host motor-control protocol integration, reviewed migration application, broader fault-case coverage, accessibility/performance acceptance, clean Windows 10/11 deployment and physical hardware tests. Experimental C++ motor adapters compile and their pure safety logic runs in host tests; these are not physical safety evidence.

0.7.0 adds a simpler learning-first interface, locally bundled fonts, a matching brand title, icon theme/audio controls, responsive lesson diagrams and automatically checked practice in all 17 authored lessons. 176 unit tests and 38 final installed Electron scenarios pass with real compilation and no skips. See [docs/RELEASE-0.7.0.md](docs/RELEASE-0.7.0.md) and [docs/DESIGN-0.7.0.md](docs/DESIGN-0.7.0.md).

0.6.0 introduces a blue launch screen with a white Jective logo, a light default theme, persistent side navigation, categorized blocks, focused editor layouts, lesson actions at the top, and readable simulation cards. Design details and screenshots: [docs/DESIGN-0.6.0.md](docs/DESIGN-0.6.0.md). This build also packages accumulated functions, debounce, analog, PWM, sound and distance-model work from L11–L17.

0.6.0 verification: 172 unit/integration tests pass; the unchanged 80 percent per-file package branch gate passes with 1296/1374 (94.32 percent) aggregate coverage. All 37 final installed-application scenarios pass with actual compilation enabled and no skips or flaky cases. The earlier 37-scenario source run precedes final presentation refinements. Installation/removal pass locally in an isolated Unicode folder. See [docs/RELEASE-0.6.0.md](docs/RELEASE-0.6.0.md) for exact evidence and acceptance limits.

0.5.0 verification: 117 unit/integration tests, type checking and lint pass. The unchanged 80 percent per-file domain branch coverage gate passes, with 91.35 percent aggregate coverage. All 24 source and all 24 installed Electron scenarios pass, including real compilation. Local installation and removal pass; the source archive is CRC and workspace-byte verified. Scope: `docs/RELEASE-0.5.0.md`.

## Artifacts

- [0.8.7 development installer](<release/JECTIVE Robotics Studio Setup 0.8.7.exe>): 151896032 bytes; SHA256 `998745297b597bac4549e44400652cbfe77a75dcfebc64ce929b0d4b22b40b1a`. Unsigned. See [verification](docs/RELEASE-0.8.7.md) and [native evidence correction](docs/ASSERTION-CORRECTION.md).

- [0.8.6 development installer](<release/JECTIVE Robotics Studio Setup 0.8.6.exe>): 151830224 bytes; SHA256 `73613662df5d8f020661a561267c4681baf0da32e5deedf66b1fc3d8e08f54ec`. Unsigned. See [verification and limits](docs/RELEASE-0.8.6.md).

- [0.8.5 development installer](<release/JECTIVE Robotics Studio Setup 0.8.5.exe>): 151802182 bytes; SHA256 `8111e9327ce4293f4bc5669b67eb064c10e83c431f972ec5961133da642784bf`. Unsigned. See [verification and limits](docs/RELEASE-0.8.5.md).

- [0.8.2 development preview installer](<release/JECTIVE Robotics Studio Setup 0.8.2.exe>): 151,644,141 bytes; SHA256 `4c0dc9acf13057248334021fa898cd23a2852915b970d3b2a2ede21fe1c6cbd2`. Unsigned. Packaged startup and ASAR tamper rejection pass on Windows 11; installation/removal, Windows 10 and physical hardware remain unverified.

- [0.8.1 Windows installer](<release/JECTIVE Robotics Studio Setup 0.8.1.exe>): 151,001,942 bytes; SHA256 `d9cfd101d30d220ccba5d95d64c551aa52ba40142fd07a792a1dfca1658ef00e`.
- [0.8.1 source archive](release/JECTIVE-Robotics-Studio-0.8.1-source.zip): source, branding assets and evidence.

- [0.8.0 Windows installer](<release/JECTIVE Robotics Studio Setup 0.8.0.exe>): 151,017,907 bytes; SHA256 `53ab3d9a31074781130bb83445bbd9231543e841eb96922843f95219ed166649`; intermediate development release.
- [0.8.0 source archive](release/JECTIVE-Robotics-Studio-0.8.0-source.zip): source and evidence; final CRC, byte comparison and hashes are recorded under `evidence/releases/0.8.0`.

- `release/JECTIVE Robotics Studio Setup 0.7.0.exe`: 150,900,155 bytes; SHA256 `45c43a99d396f4fc6c0f774bc5b3fce13d4e681ca30f52583385b7aad8e91f69`; NotSigned intermediate installer.
- `release/JECTIVE-Robotics-Studio-0.7.0-source.zip`: source and evidence; CRC, byte comparison and hashes are recorded under `evidence/releases/0.7.0`.

- `release/JECTIVE-Robotics-Studio-0.6.0-source.zip`: source and evidence archive; final CRC, byte comparison and SHA256 are recorded externally under `evidence/releases/0.6.0/source-verification.json`.

- `release/JECTIVE Robotics Studio Setup 0.6.0.exe`: 150,721,040 bytes. SHA256 `ac0657dd128e938d9dff0976111d34f557714994576b71895b2ec619f8f5b91d`. Intermediate build; complete product acceptance remains outstanding.

- `release/JECTIVE-Robotics-Studio-0.5.0-source.zip`: source/evidence archive; size/hash and CRC/byte verification are recorded in `evidence/releases/0.5.0/source-artifact.json` and `source-verification.json`.

- `release/JECTIVE Robotics Studio Setup 0.5.0.exe`: 150,607,846 bytes; unsigned intermediate installer. SHA256 `22ac62107d06ca80dc73cd6c300628508d2bb8a6ff2ad5f673e45dad277f36ad`. Verification and scope: `docs/RELEASE-0.5.0.md`.

- `release/JECTIVE Robotics Studio Setup 0.4.0.exe`: 150,588,169 bytes; unsigned intermediate NSIS installer. SHA256 `7c7dce243257c6f133bf7fc2f877cbaa476173e18f23d02370042d7aaddfaefe`. Verification and scope: `docs/RELEASE-0.4.0.md`.
- `release/JECTIVE-Robotics-Studio-0.4.0-source.zip`: source and evidence archive; size/hash are in `evidence/releases/0.4.0/source-artifact.json`. Every ZIP entry was CRC checked and compared with source at packaging time by `scripts/verify-source.py`; subsequent source changes are outside this immutable archive.

- `release/JECTIVE Robotics Studio Setup 0.3.0.exe`: 150,585,627 bytes; unsigned intermediate NSIS installer. SHA256 `3c26489ef4b60ff766ccd9d27a1997de5460af935626e8488a596534b53a8208`. Verification and scope: `docs/RELEASE-0.3.0.md`.

- `release/JECTIVE Robotics Studio Setup 0.2.0.exe`: 150,492,035 bytes; unsigned NSIS installer. SHA256 `c686f10797d862d05ba80a052c618c49631e3cc5b0f02cb971b1a3db01636894`.
- `release/JECTIVE-offline-toolchain-1.5.1-esp32-3.3.12.7z`: 1,254,009,156 bytes, 59,753 manifest-verified files; SHA256 `d2355ceb91a2c25029f854a61894c91dc74ebeaa1bf55408018a88eee450abd0`.
- `evidence/`: commands, compiler manifests, unit/UI reports, C++ safety execution, installation records, dependency audit, SBOM, notices and checksums. `test-results/` is temporary, not the only retained evidence.

The 0.4.0 installer passed all 18 installed-executable scenarios without skips and its isolated local installation/uninstallation lifecycle. See `docs/RELEASE-0.4.0.md` and `evidence/releases/0.4.0`.

The 0.3.0 installer passed all 14 installed-executable scenarios without skips and its isolated local installation/uninstallation lifecycle. See `docs/RELEASE-0.3.0.md` and `evidence/releases/0.3.0`.

The earlier 0.2.0 installer was installed in an isolated per-user path containing spaces and Cyrillic on this existing Windows 11 workstation. All five installed-application scenarios passed, including actual good/bad compilation, Unicode files, real native serial binding enumeration, robot worlds, classroom records, lesson loading, snapshots and explicit test-only AI provider/diff review. This does not establish a clean Windows 10 or separate standard-user acceptance gate.

## Development

Tested host: Windows 11 Pro x64 build 26200; Node 24.21.0, npm 12.0.2. Dependencies are exactly locked. No development server or CDN is used.

```powershell
npm ci
# If npm skipped Electron's download script:
npm rebuild electron
npm run typecheck
npm run lint
npm test
npm start
```

`npm start` builds local assets and removes inherited `ELECTRON_RUN_AS_NODE`. Normal desktop operation uses isolated per-user SQLite and toolchain directories. Projects and exports remain user-selected. Keys never enter project schemas or exports.

## Actual compilation and firmware

Prepare verified official Arduino CLI 1.5.1 in `.toolchain/bin`, then install official ESP32 core 3.3.12 as described in `docs/TOOLCHAIN.md`:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/toolchain-setup.ps1 -Destination .toolchain/workspace
npm run firmware:check
npm run firmware:runtime
npm run firmware:safety
$env:JECTIVE_REAL_COMPILER='1'
npm run test:e2e
```

The host C++ test requires verified Zig 0.15.2 under `.toolchain/host`. Compiler checks demand artifacts, invalid source rejection and stale-build prevention. The experimental runtime has two active-high H-bridge adapters, ±30% duty, bounded duration, 400 ms tethered expiry, reversal dwell and an independent FreeRTOS output task. See `firmware/jective-runtime/README.md`. No board is identified: **upload, handshake and physical observations are NOT RUN**.

## Offline packaging

```powershell
npm run toolchain:bundle
npm run toolchain:verify
npm run inventory
npm run package
$env:JECTIVE_EXECUTABLE=(Resolve-Path 'release/win-unpacked/JECTIVE Robotics Studio.exe').Path
$env:JECTIVE_REAL_COMPILER='1'
npm run evidence -- test:e2e
```

The archive helper is official 7zr 26.04 under `.toolchain/host`. Import an extracted toolchain through Projects and tools. Files are hash-verified and staged. A separate copied toolchain compiled successfully; network adapters were not disabled. Clean disconnected-machine acceptance is NOT RUN. See `docs/DEPLOYMENT.md`.

`npmRebuild:false` retains serialport's Windows x64 Node-API prebuild. Actual loading is tested in installed Electron. Native rebuild failed because Visual Studio is unavailable. Revalidate native compatibility when dependencies change.

`npm run content:validate` correctly exits 1: current unpublished source has L01-L17, each exceeding 600 English learner words with draft KK/RU versions, but 43 required lessons and language review remain missing. Published 0.5.0 contains L01-L10; its immutable installer and source archive do not contain the subsequent functions, input models, plotting or PWM work. See [current L17 work and evidence](docs/WIP-L17.md). Historical 0.2.0 artifacts contain only L01/L03; 0.3.0 packages L01-L06 and 0.4.0 packages L01-L10. Eight guides disclose unsupported drivers. `npm run release:verify` cannot pass until remaining requirements are completed.

## Status

Read `docs/HANDOFF.md`, `docs/requirements.json`, `docs/RELEASE_NOTES.md`, `docs/ARCHITECTURE.md`, `docs/THREAT_MODEL.md` and `docs/HARDWARE.md`. Unknown JECTIVE wiring remains unassigned. No fake compiler states, fabricated ports or cloud-only core workflows are used. Failed runs remain evidence, not PASS results.
