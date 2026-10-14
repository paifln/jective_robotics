# Classroom integrity during backup inspection

Current source checks assignment IDs, submission IDs/assignment IDs/learner IDs/versions and grade submission IDs against their validated JSON content before restoration. It rejects submissions whose assignment is absent, grades whose submission is absent and recovery settings pointing to an absent project. Damaged relational metadata is no longer silently replaced by JSON values during reconstruction.

The new test creates real isolated SQLite classroom records and backups, then deliberately corrupts assignment metadata, submission version, grade metadata and the recovery pointer. It also removes an assignment and a submission to verify orphan rejection. Every damaged backup is rejected by the inspector. Existing valid five-learner classroom exchanges, backup reconstruction and other tests remain passing.

Strict TypeScript and ESLint passed, as did all 49 unit/integration tests. The existing Electron backup/restore scenario passed against the rebuilt source app, preserving snapshot metadata and the pre-restore backup. Reports are in `evidence/wip-backup-classroom-integrity`. These checks do not replace full migration, crash, disk-failure or installed-executable acceptance. Published 0.2.0 artifacts are unchanged, and the complete specification remains unfinished.
