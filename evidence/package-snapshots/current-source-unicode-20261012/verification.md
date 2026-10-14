# Updated package snapshot

Built using `.verification/package-unicode-config.json`, copying the current full build settings and changing only the output directory. Build, `security-package-check.mjs current-source-unicode-20261012` and the matching external worker diagnostic exited 0. All built assets matched source hashes, including the Unicode process-log fix, local audio and environment worker. Production packaged startup/workspace IPC, duplicate-instance behavior, binary fuses and ASAR tamper rejection/restoration passed on Windows 11 build 26200.

The external matching Electron host loaded the actual worker from ASAR, checked a four-file fixture in a path with spaces/Cyrillic, detected a same-size timestamp-preserved edit and rejected missing files. The actual packaged serial module enumerated OS ports without opening one. These checks do not prove the full packaged learner/compiler flow or physical hardware.

This is an unpacked snapshot with version 0.8.18, distinguished by directory and hashes in the receipts. It is not a new installer. The earlier snapshot and public installer remain separate. Clean installer lifecycle, Windows 10, physical upload and full packaged compiler GUI are NOT RUN.
