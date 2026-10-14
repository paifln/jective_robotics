# Project search loading and keyboard controls

Project search input now has a 100-character limit consistent with the IPC request schema. While searching, localized status announces finding projects instead of a misleading zero count; project rows expose aria-busy.

Two source Electron tests passed: project browser and reading regression. At 480px, keyboard Tab moved from Refresh to the search input, displayed its 2px focus outline, moved to Open project, and Shift+Tab returned to search. Existing delayed-response, initial-load interruption, pagination and actual open checks also passed. Build and typecheck passed; lint passed. These checks do not constitute screen-reader or complete accessibility certification.

Source-only; no preview restart, package or installer update.
