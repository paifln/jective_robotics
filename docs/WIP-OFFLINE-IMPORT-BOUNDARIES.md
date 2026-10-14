# Offline importer boundary tests

New filesystem tests verify that verification-only mode creates no staging directory and preserves the target, a missing core is rejected, case-duplicate paths are rejected, directories cannot masquerade as manifest files, and a real directory junction escaping the selected source is rejected. The junction points only to another directory inside the test's own temporary root.

An explicitly injected failure of the final staging-to-target rename exercises rollback while all other filesystem operations are real. The test verifies restoration of the previous target's bytes and removal of staging. This is controlled software fault injection, not a power-loss or disk-hardware test. Payloads are labeled test fixtures and are not substitutes for an Arduino toolchain; the earlier genuine bundle verification remains separate evidence.

All 77 tests passed. Offline-importer branch coverage is 30/35 (85.71 percent); total domain branch coverage is 657/795 (82.64 percent). Device lifecycle, SQLite workspace and the compiler/uploader service still fail the per-file 80 percent gate. Type checking and lint passed. This source/test work follows published 0.4.0, and full master-specification acceptance remains incomplete.
