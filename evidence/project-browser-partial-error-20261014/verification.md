# Project browser partial failure

Extended isolated source Electron regression with one deliberately failed snapshot-history response while guarded project list/workspace handlers still execute normally. Refresh reports the failure, retains the selected project's list row and becomes enabled again. Subsequent successful refresh removes that error and retains the project; keyboard navigation and actual project opening still pass. Original pagination, initial-load interruption and late-search-response assertions also pass.

One Electron test passed. This turn changes tests/evidence only; production code and latest design-polish package remain unchanged. Main IPC wrapper is a source-only fixture, not a production override. No full hardware/release acceptance claim.
