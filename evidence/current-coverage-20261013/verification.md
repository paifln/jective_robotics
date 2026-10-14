# Current domain coverage

Command npm run test:coverage exited 0 on Windows 11 build 26300. All 548 Vitest tests pass. V8 coverage includes packages/**/*.ts; unchanged threshold requires 80 percent branch coverage per file. 248 reported files, none below that branch gate. Aggregate branches 96.31 percent, statements 98.17, functions 98.73, lines 99.8. Exact counts and per-file values are in coverage-summary.json.

Scope excludes renderer/main/preload, services/assistant JavaScript, native firmware, real compiler, installed Windows journeys and physical boards. High coverage does not prove that every safety transition is identified or physically verified. Those acceptance requirements remain separately scoped. No threshold reduced and no tests skipped to obtain this result.
