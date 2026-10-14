# Current learning/search source package snapshot

Separate unpacked Windowsx64 snapshot built from current source with the full package configuration; only output directory overridden. Version remains0.8.18. This is not a new NSIS installer or a complete release acceptance result.

- npm run build and electron-builder --win --dir --x64 --config .verification/package-learning-config.json: exit0.
- Production startup/workspace initialization, duplicate-instance handling, configured binary fuses, all273built-asset hashes including local audio/worker, and packagedCLI equality passed.
- Intentional ASAR whitespace mutation rejected; original archive restored and hash verified.
- Actual host: Windows11Pro10.0.26300 (CIM), verifier reportsWindows_NT/10.0.26300. Initial receipt mistakenly contained a hardcoded26200 scope; preserved in initial-hardcoded-os-metadata.json. Verifier now records actual OS/Node metadata and all checks were rerun successfully.
- Actual packaged worker from ASAR via matching external Electron host: four-file fixture with spaces/Cyrillic, preserved-timestamp content change and missing-file rejection passed. Packaged serial module listed2OSports; none opened.
- npm audit --audit-level=high: exit0,0known vulnerabilities at2026-10-12T17:56UTC. Advisory scan is not proof of all security properties.

ASARSHA256:f809c0a4a40c2d5a8ba93dfb60017ba3fe013fa8bd9da7d8dc1aef2f3d956d7a
EXESHA256:ab3f412635456ae4bce38b55cd5422a0c899ed25c1f8216cab3f9223c7f096d4
Published installer unchanged SHA256:8de7b4fddb70c34d21e8eaee78c257ba618618cf69a84a3d8935d1bf3f480897.

NOT RUN: complete current packaged learner/compiler path, actual upload/handshake/physical behavior, clean Windows10, NSIS install/upgrade/repair/uninstall and human curriculum/trilingual acceptance. External worker fixture is not the production full SDK/compiler journey. Old snapshots and installer were not replaced. No signing certificate or successful physical verification claimed.

Subsequent2026-10-13 actual production EXE editor/compiler/restart journey under ordinary app/profile/SDK paths containing spaces and Cyrillic PASSED. See [the scoped journey report](learner-packaged-journey-20261013-4bd6d4f0/verification.md). Temporary loopback Chromium diagnostics, unchanged fuses/archive/executable, no main inspector. Earlier NOT RUN entry for compiler journey is superseded only by this specific path, not complete packaged learner acceptance.
