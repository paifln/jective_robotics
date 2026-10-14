# Backup metadata preservation

Backup reconstruction previously assigned a generic label to every snapshot and replaced project/snapshot timestamps with the restoration time. Current source preserves the original project save date and snapshot ID, project ID, name, creation date and validated project content. New snapshots continue with IDs above the restored maximum.

Inspection rejects mismatches between project JSON and relational metadata, invalid dates, invalid snapshot IDs and invalid labels. All seven tables are checked against the record limit before reading their contents. Progress rows are read completely rather than silently truncating at 1000. Existing read-only inspection, unsafe-schema rejection and reconstruction into a fresh known schema remain in place.

Strict TypeScript and ESLint passed, as did all 33 unit/integration tests. The metadata test checks exact reconstruction, post-restore snapshot IDs and rejection of a mismatched snapshot project ID. A targeted Electron test executes the actual backup/restore bridge with isolated test-file dialog selections and the explicit restore confirmation. It verifies the exact snapshot list, the original project save date, removal of a snapshot added after backup and retention of the pre-restore workspace backup. Reports are in `evidence/wip-backup-metadata`.

This verifies the rebuilt source application. It does not cover power-loss fault injection, full disk, every migration or the installed executable. Published 0.2.0 artifacts remain unchanged. The broader specification remains unfinished.
