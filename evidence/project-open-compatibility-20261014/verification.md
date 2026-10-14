# Project open API compatibility

Scoped source Electron run passed backup restore (named snapshot metadata and previous database backup retained) and Code-copy persistence (saved block original versus independently edited copy). Project-actions test initially failed because its held-response fixture intercepted workspace:project instead of the new workspace:openProject. Updated that test fixture; corrected run passed snapshot save/restore, repeated-click guard, rejected IPC recovery and obsolete response after navigation. Initial and corrected reports retained.

Typecheck/lint passed. This turn changes the test fixture only. Stale-navigation test verifies renderer view behavior, not file-binding preservation during every possible asynchronous navigation race. No production package, installer or hardware acceptance claim. Latest immutable design-polish package remains older than the API split.
