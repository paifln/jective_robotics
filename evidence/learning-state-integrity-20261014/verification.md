# Learning grade state integrity

parseLearningRecord now recomputes gradeActivity for every non-draft saved record, including simple foundations and programming activities. Previously only complex self-reported activity kinds checked the stored state. A forged checked grade with empty foundation answers is now rejected with LEARNING_RECORD_STATE_INVALID during direct read or backup inspection. Drafts remain permitted without a passing grade.

Two new regressions pass: direct parse of valid incomplete/draft states versus forged checked state; actual SQLite backup modification rejected while current workspace notes remain unchanged. Full unit run: 554 tests/187 files passed. Build/typecheck/lint passed. Source Electron foundations/help test passed, including real answers, repeated feedback and stored learning progress.

Compatibility: pre-existing inconsistent non-draft records are rejected rather than silently accepted or rewritten. This does not provide tamper-proof progress: a local file owner can change answers and other data. No new package/installer or physical verification; latest design-polish EXE predates this source change.
