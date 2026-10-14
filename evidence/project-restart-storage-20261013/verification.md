# Project persistence through restart and revision conflict

Source Electron test PASS with isolated real SQLite and an actual Unicode project path. A code project containing Kazakh/Russian text and CRLF source is saved at revision 1, snapshot metadata retained, process exits and a new Electron process opens the same workspace. Recovery equals the saved project, snapshot metadata equals the prior result, native file open preserves source and the next save advances to revision 2.

An explicit external-file fixture advances the file revision to 3. Saving the stale revision-2 project returns PROJECT_CONFLICT and external file bytes remain identical. This proves versioned conflict detection; it does not prove detecting edits that leave the revision unchanged. Project conflict recovery text now localized EN/RU/KK, with four formatter tests PASS. Source build/typecheck/lint PASS. Native file destinations are explicit dialog fixtures, not physical OS interaction. Restart uses normal application exit, not a forced crash or power loss.

No new packaged EXE in this change. current-source-reading-access-20261013 is the preceding immutable package and predates the conflict message and foundation heading-focus source changes. No installed-app, hardware or remote service verification.
