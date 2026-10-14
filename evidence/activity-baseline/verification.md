# Studio saved-code activity baseline

Post-release source change; published installer 0.8.18 is unchanged and does not include this fix.

Opening a previously unknown project establishes its initial program fingerprint without adding activity. Native project and Code copies establish their baseline in the same database transaction that preserves the copy, before an immediate edit or assistant proposal can be applied. The renderer supplies the already loaded Blockly serialization on document selection, avoiding a difference caused by serialization metadata. A successful save adds activity only when the program differs from the known fingerprint. Autosave, snapshots, unchanged saves and cancelled saves do not add a day. An unknown legacy project's first save conservatively establishes a baseline; historical activity is preserved.

Verification on the available Windows 11 host:

- Full unit/coverage run: 478 tests passed, no failed suites; 96.56% branch coverage. Real SQLite tests cover baseline isolation, copy-before-edit, persistence/backup and transaction rollback.
- Typecheck, lint and build passed.
- Two normal source Electron GUI scenarios passed: untouched Blocks starter save, untouched Code conversion save, actual Monaco edits, repeated save, untouched project copy, cancelled save followed by successful save; existing Studio icon rail, expanded editor, board dialog, responsive layout, maps and student assistant checks.
- GUI tests use isolated temporary workspaces and predetermined native save-dialog paths. Program-file IO, native IPC, SQLite and activity accounting are real. Only test-owned app processes are exited.

Reports: `.verification/activity-baseline/unit.json`, `coverage-summary.json`, `e2e.json`. The initial GUI failure is retained separately: the cancellation assertion expected `Cancel`, while the application currently displays `SAVE_CANCELLED`; the fixture also lacked the typed `filePath` property. Corrected fixture/assertion passed. An earlier full run failed because of a wrong conversion import and an old first-save-count expectation; those were corrected before the successful full run. That earlier unit JSON was overwritten by a targeted run, so no separate report is claimed for it.

Limits: activity records changed saved source, not authorship or proof of learning. An externally modified document retaining a previously known UUID can differ from its previous saved fingerprint. Historical mistaken credits cannot be attributed safely and are not deleted. Physical board upload, Windows 10, clean installer lifecycle and this fix in a packaged installer were not tested. Course remains 56/60 draft lessons; broader master acceptance is incomplete.
