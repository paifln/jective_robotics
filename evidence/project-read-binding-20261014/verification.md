# Read-only project lookup and explicit opening

workspaceProject/workspace:project is now read-only and does not clear the main process file/revision/fingerprint binding. New typed workspaceOpenProject/workspace:openProject explicitly clears it when a stored project exists, under the existing sender/origin and restore guards. StudentProjects asks canLoad before either opening or restoring a snapshot; parent no longer confirms after the privileged action.

Source Electron regression saves a real file, reads its database copy, saves the next revision to the same path without another native dialog, then explicitly opens the copy and confirms the next save requests a new path. Revision 2 and actual disk source checked; source-only Save dialog fixture returns canceled for the new path.

Two further source UI checks passed: canceling unsaved-change confirmation sends zero openProject calls; accepting sends one and opens Studio. Project browser and reading regression retained. Build, typecheck and lint passed. Reports cover four test executions across two scoped runs, not full E2E acceptance. Latest domain baseline remains 554 tests/96.29 percent branches; not rerun for this main/renderer change.

Source-only; latest immutable design-polish EXE predates this API split. No user data, installer, Windows 10 or physical hardware verification.
