# SQLite lifecycle verification

Four additional tests use real temporary SQLite databases. They verify project deletion removes only that project's snapshots, preserves another project's recovery pointer and lesson progress, and clears recovery when its own project is deleted. Snapshot restoration returns the original project and missing records return null.

A deliberately failing transaction rolls back its settings write; a subsequent preference write succeeds on the same connection. Classroom checks reject unknown assignments and submissions, unknown rubric items and replacement grades while preserving the first grade. A database with a newer schema is refused without changing its sentinel data.

All 83 unit/integration tests passed. Type checking and lint passed. Workspace branch coverage is 70/79 (88.60 percent); aggregate domain coverage is 674/797 (84.56 percent). The coverage command still exits unsuccessfully because the compiler/uploader service is at 18.96 percent, below the per-file 80 percent requirement. That requirement has not been reduced.

These are source changes after published 0.4.0. They do not establish power-loss recovery, cross-process concurrency, physical hardware operation or complete master-prompt acceptance. The course still contains 10 of the required 60 lessons.
