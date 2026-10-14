# Custom profile bindings in classroom exchange

Portable project, assignment and submission archives now validate embedded profile hashes on both encode and decode. SQLite assignment starters and submission projects receive the same validation during writes, classroom reads and backup inspection. A changed nested profile definition is rejected before the archive is accepted or the database is modified. Valid custom definitions survive classroom backup reconstruction in a fresh store.

Two tests cover all three archive kinds, deliberately constructed tampered ZIP content, real SQLite classroom exchange and altered assignment/submission backup data. All 115 tests passed with unchanged per-file branch thresholds; aggregate coverage is 849/928 (91.48 percent). Type checking and lint passed. Three source Electron scenarios covering classroom/serial/simulation features, portable timer import/export and backup restoration passed in 10.5 seconds.

The initial Electron build exposed a browser dependency boundary: telemetry imported CSV escaping from the archive module, which now depends on Node cryptography. CSV escaping has been moved to a separate browser-safe module, with the archive module re-exporting its existing API. The corrected browser build and scenarios passed; hash verification remains in the main-process persistence path.

Physical operation, reviewed migration application and complete master acceptance remain incomplete. Published 0.4.0 artifacts are unchanged. Reports are retained in evidence/wip-custom-profile-classroom.
