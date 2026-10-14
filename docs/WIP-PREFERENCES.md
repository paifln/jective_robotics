# Persistent theme and independent preference updates

Current source stores dark/light theme in the existing SQLite settings table and restores it on startup. Workspaces from before this change default to dark; no destructive schema migration is required. Preference IPC now accepts validated, nonempty partial updates, so changing language, classroom role or theme cannot overwrite an unrelated setting using a stale workspace read. Invalid keys, values and empty updates are rejected by the shared schema and store.

Backup inspection permits the new theme key and validates all setting values according to their key: supported languages, roles, boolean text, themes and recovery UUIDs. Invalid theme values are rejected before reconstruction.

Verification includes persistence after closing/reopening the database, validated backup/reconstruction, preservation of unrelated settings, rejected malformed input, and rejected invalid backup settings. The Electron scenario toggles the real theme control, confirms SQLite state, changes role/language, closes the process, launches another process against the same isolated workspace and verifies the restored light theme, teacher role and Russian language. This tests the rebuilt source app, not the published installer. Reports are in `evidence/wip-preferences`.

The complete application specification remains unfinished. Published 0.2.0 artifacts and checksums are unchanged; these changes have not been repackaged.
