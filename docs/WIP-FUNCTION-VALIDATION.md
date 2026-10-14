# Function validation foundation for L11

A separate typed function-program model now represents named void behavior with numeric-expression arguments and up to eight parameters. Its validator checks identifiers, duplicates, parameter names, call existence/arity, expressions, existing instruction rules, nesting and total program size. It rejects direct/indirect recursion and call chains longer than seventeen functions, and produces deterministic dependency-first ordering. Cached graph heights ensure a previously visited dependency cannot conceal an excessive later call path.

Four new tests cover two parameterized call sites, nested branches/loops, deterministic ordering, malformed signatures/calls, recursion, call depth and program limits. All 121 unit/integration tests passed. Type checking and lint passed. Aggregate branch coverage is 914/995 (91.85 percent), with unchanged per-file thresholds. Reports are retained in evidence/wip-function-validation.

This is validation groundwork, not completed function execution. C++ signatures/call lowering, simulator scopes, Blockly procedure blocks and authored L11 material remain to implement. The current application still uses its existing Program model. Published 0.5.0 installer and source archive remain immutable and do not include these subsequent changes. The course still has 10 of the required 60 lessons.
