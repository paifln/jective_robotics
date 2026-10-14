# Windows deployment and offline toolchain

This is an unsigned development build, not a hardware-ready school release. Tested host: Windows 11 Pro x64 build 26200, Ryzen 5 5600H, 16 GB RAM. Clean Windows 10 and a separate standard-user account are NOT RUN.

1. Verify the installer SHA256 against `evidence/artifacts.json`. Launch the NSIS EXE and choose a per-user location. Keep student projects outside that folder. No Node installation or development server is required.
2. Core editors, authored lessons, guides, reference, SQLite records and six simulator worlds are bundled locally. No sign-in, CDN or cloud database is used. Network adapters on this host were not disabled; a genuinely disconnected clean-machine acceptance test remains required.
3. Separately transfer `JECTIVE-offline-toolchain-1.5.1-esp32-3.3.12.7z`, SHA256 `d2355ceb91a2c25029f854a61894c91dc74ebeaa1bf55408018a88eee450abd0`. The archive is 1,254,009,156 bytes; the manifest describes 6,875,767,932 unpacked bytes across 59,753 files. Reserve additional space for compilation outputs and a previous toolchain copy. This archive includes the installed official package tree, metadata and included license notices; school redistribution policy must be reviewed separately.
4. Extract with a trusted 7-Zip utility. A standalone official `release/offline-tools/7zr.exe` is supplied with its download/hash record; it needs no administrator installation. Open Projects and tools → Import offline toolchain folder; select the extracted folder containing `jective-toolchain-manifest.json`, `data` and `user`. Import rejects traversal, links escaping the source, duplicate names, unexpected roots, excessive sizes and mismatched hashes. It stages the files before changing the current toolchain and retains the previous directory. No privileged USB driver is installed.
5. Check toolchain, select the identified reference board and compile a known-good indicator. Arduino CLI must be 1.5.1 and ESP32 core 3.3.12. A copied manifest-verified toolchain was compiled on this workstation; this does not substitute for the disconnected clean-machine test.
6. Connect only the identified compatible board. Refresh ports, choose its actual COM port and baud explicitly. Bluetooth ports are not board identity. Upload requires the latest successful matching source/profile/wiring build, unchanged artifacts and a native confirmation. No physical upload or motor test has run here.
7. Workspace backup preserves local database records. Projects and archives are user-selected files. The NSIS configuration retains application data on uninstall. Export and back up before changing installations. Do not infer a tested upgrade, repair or uninstallation from the existence of the installer.

Silent NSIS installation uses `/S /D=<absolute per-user directory>` with the directory argument last; the isolated local installation test, if run, is recorded in `evidence/installation.json`. A separate standard-user and clean Windows 10/11 lifecycle matrix remains outstanding.

Developer reproduction:

```powershell
npm ci
npm run typecheck
npm run lint
npm test
npm run firmware:check
npm run firmware:runtime
npm run firmware:safety
npm run toolchain:bundle
npm run toolchain:verify
npm run inventory
npm run package
```

The C++ host test uses a verified official Zig 0.15.2 download under `.toolchain/host`; the archive helper is official 7zr 26.04. These are development/test utilities, not bundled desktop runtime dependencies. `npmRebuild:false` intentionally retains serialport's Windows x64 Node-API prebuild; development and packaged Electron enumeration tests verify actual binding loading. If dependencies change, recheck this compatibility rather than assuming all native modules are interchangeable.

For live AI, the user configures an OpenAI-compatible HTTPS endpoint or local-loopback HTTP provider and a model. No default requests occur. Windows secure storage encrypts keys. Provider changes clear an old key unless a new one is explicitly entered. The automated provider fixture is explicitly test-only; no real provider credentials were available.
