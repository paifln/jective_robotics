# 0.8.2 development preview: student interface, hardware photographs and packaging safeguards

This is an intermediate learning-software build, not completion of the 60-lesson master prompt or acceptance of physical JECTIVE hardware. The newer user instruction removes the local-class screen and prioritizes independent students. Existing classroom storage and portable archive support remain available in the backend.

## What changed

The student interface described in [STUDENT-EXPERIENCE-WIP.md](STUDENT-EXPERIENCE-WIP.md) is now included in the new build. It contains 36 draft lessons, a larger Blockly/Monaco editor, icon commands, offline help, reviewed independent Code copies, six simulation worlds and four executable examples, and an ESP32 USB workflow.

Early lessons show a real ESP-WROOM-32 board photograph with six selectable explanations: USB, the processor module, GPIO, power/GND, EN and BOOT. Five lessons reuse this identification tour where relevant. Three indicator lessons show a real LED; three distance lessons show an HC-SR04 photograph and explain its labeled connections. All images are bundled locally and load without internet. The source and licenses are recorded in `assets/licenses/learning-photos.txt` and visible beside the photos. The example 30-pin board is explicitly distinguished from a verified JECTIVE carrier pinout.

## Architecture and security changes

Educational copy/photo metadata reside in pure content modules, while photo rendering is separate from the lesson animation component. Main-process URL policy and structured operational logging are infrastructure modules rather than renderer or hardware logic. Existing profile validation, serial communication, compiler artifacts, assistant services and transactional storage remain separate services.

Main-process IPC requires the actual main window, its main frame and the exact local application document. Local resource requests reject malformed encoding, path escapes, alternate hosts, credentials, non-assets, Windows alternate data streams and non-GET methods; resolved paths are checked again before reading. Renderer permissions, device permissions, new windows, frame navigation and webview attachment are denied. Sandbox and context isolation remain enabled, and Node integration remains disabled. The CSP additionally prohibits embedded objects, frame content, base-URL changes and form submissions.

An upload holds the hardware-operation lock while its confirmation dialog is open and rechecks that the selected port still exists afterward. Cancellation and validation errors release the lock. Source/profile/wiring hashes, artifact checksums and stale-build rejection remain intact. A single-instance lock prevents two new-version processes from opening the same workspace concurrently.

Operational errors are recorded as bounded, rotating JSONL metadata. The logger does not accept source, AI questions, paths or keys; unexpected error text is replaced with a generic log code. User-facing diagnostics remain available. Logging failures cannot prevent saving or hardware cleanup.

The packaged EXE disables RunAsNode, NODE_OPTIONS and Node CLI inspection. It enables cookie encryption, ASAR integrity validation and loading application code only from ASAR; extra file-protocol privileges are disabled. These options affect packaged binaries, while the development Electron executable remains usable for source tests. Upstream references: [Electron security](https://www.electronjs.org/docs/latest/tutorial/security), [fuses](https://www.electronjs.org/docs/latest/tutorial/fuses), [ASAR integrity](https://www.electronjs.org/docs/latest/tutorial/asar-integrity).

## Verification and evidence

The authoritative results for this build are stored under `evidence/security-learning`. Type checking, lint, build and 311 unit/integration tests pass. The existing 80% per-file package branch gate remains enabled; aggregate package branches are 2483/2585 (96.05%). `npm audit` reports zero known vulnerabilities at the recorded check time; this is not a complete security audit or a guarantee against undiscovered issues.

All four targeted source Electron scenarios pass with no skips or flakes. They exercise photos in both themes, actual offline image loads, component descriptions, permissions, window blocking, local resource policy, rejection of a foreign window's IPC, and the hardware-operation lock during a mocked confirmation. They also exercise the redesigned student flow, simulator, independent reviewed Code copy, and real valid/invalid Arduino CLI ESP32 compilation. Port enumeration in the upload-gate checks is explicitly a fixture; no upload is attempted.

`scripts/security-package-check.mjs` reads the actual executable fuse states, compares selected packaged code/assets and the bundled CLI with build inputs, starts the packaged renderer in a fresh temporary workspace, checks duplicate-instance exit, and deliberately changes one whitespace byte in packed main code to test integrity rejection. It restores the original ASAR and verifies its hash. Its machine-readable receipt is written only after all checks succeed. This is a packaged-app check, not NSIS installation/removal acceptance.

The package check passed: the renderer initialized through its real workspace IPC, the duplicate exited with code 0, and the altered ASAR exited with code 1 and an explicit `ASAR Integrity Violation` hash-mismatch diagnostic. The original ASAR was restored and hash-verified. The generated installer is `release/JECTIVE Robotics Studio Setup 0.8.2.exe`, 151,644,141 bytes, SHA256 `4c0dc9acf13057248334021fa898cd23a2852915b970d3b2a2ede21fe1c6cbd2`, Authenticode status `NotSigned`. A checksum identifies this local artifact; it does not authenticate a publisher.

## Remaining verification

- This machine is Windows 11 Pro, OS build 26200. A legacy registry-derived product label says Windows 10, but the operating-system caption/build identify Windows 11. Windows 10 compatibility has not been tested; perform startup, editing, compilation, serial enumeration, installation, removal and data-preservation tests on a clean Windows 10 x64 machine.
- No publisher certificate is available. The generated installer and executable are unsigned. Do not treat checksum/fuse checks as publisher authentication; production distribution requires signing and signature verification. Existing published installers are unchanged.
- NSIS installation/removal of this new build, clean-machine deployment and antivirus/SmartScreen acceptance remain unverified. Packaging and unpacked-runtime checks are separate evidence.
- No physical ESP32/JECTIVE board was connected. USB upload, physical signal levels, motors/sensors, reviewed JECTIVE connector assignments and robot safety behavior remain unverified. Additional adapters and integrated hardware code generation remain unfinished.
- Independent language review, the remaining 24 lessons and full accessibility/performance acceptance remain outstanding. Historical installed-app test counts refer to their original releases; they do not imply that the entire historical UI suite passes the redesigned navigation.

Reproduce source checks with `npm run typecheck`, `npm run lint`, `npm run test:coverage`, `npm run build`, and the four scenarios in `hardware-security.spec.ts`, `student-experience.spec.ts` and `code-copy.spec.ts`. Build into `.verification/security-package-0.8.2` with electron-builder, then run `node scripts/security-package-check.mjs` against that isolated package.
