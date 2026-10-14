# Verified upstream references

Implementation inspection date: 2026-10-10. Environment: Windows 11 Pro build 26200, Node 24.21.0, npm 12.0.2. Windows 10 testing is NOT RUN.

Electron 44.7.0, Blockly 13.3.0, Monaco 0.57.0, React 19.3.0, electron-builder 26.15.3 were queried from the npm registry. Dependencies are locked in package-lock.json. TypeScript 5.9.3, esbuild 0.28.2, Vitest 5.0.3, ESLint 10.12.0 and typescript-eslint 8.71.1 form the tested toolchain. These version choices do not imply every acceptance criterion has passed.

Official references consulted:

- [Electron security](https://www.electronjs.org/docs/latest/tutorial/security): sandbox, context isolation, sender validation, packaged custom scheme, constrained navigation and CSP.
- [Blockly serialization](https://docs.blockly.com/guides/configure/serialization/): full workspace JSON save/load.
- [Blockly custom generators](https://docs.blockly.com/codelabs/custom-generator/the-basics/): custom Arduino generation rather than a fictitious built-in generator.
- [Arduino CLI configuration](https://docs.arduino.cc/arduino-cli/configuration/): isolated application directories.
- [ESP32 core installation](https://docs.espressif.com/projects/arduino-esp32/en/latest/installing.html): official package URL.
- [NSIS configuration](https://www.electron.build/nsis/): per-user assisted installer and preserved app data.

The CLI 1.5.1 official GitHub release and checksum list were queried, downloaded and compared. Actual compile/upload help was checked. ESP32 core 3.3.12 was selected from the official package index. Current Electron Windows 10 compatibility requires upstream review plus an actual Windows 10 test before support can be claimed.

Security review: the initial Vitest critical advisory was eliminated by updating to 5.0.3; DOMPurify advisories were eliminated by pinning 3.4.16. A trial electron-builder 26.5.0 dependency tree increased vulnerabilities and was discarded. The restored 26.15.3 tree initially reported eight moderate findings rooted in build-time sprintf-js through the packaging proxy logger. A maintained global-agent 4.1.3 override removes that logger dependency; the latest npm audit reports zero known vulnerabilities. The override is checked by repackaging. This audit is not proof of the complete security acceptance gate.
