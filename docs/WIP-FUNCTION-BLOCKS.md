# Function blocks and Studio integration — unpublished work

Blockly now includes a top-level function definition with a name and comma-separated parameters, plus call blocks with 0–8 expression arguments. Workspace serialization retains the definition, parameters and call sites. `toFunctionProgram` validates the graph and returns the legacy shape when no functions are present. The legacy parser explicitly rejects function programs rather than silently discarding definitions.

Studio uses the corresponding generator and passes function programs to both indicator and robot workers. Existing project JSON stores these blocks without a new persistence format. Two unit tests exercised every supported arity through actual Blockly load/save/load, generation and execution, and rejected malformed parameters, recursive and missing calls. All 133 unit tests pass; aggregate branch coverage is 989/1074 (92.08%), with unchanged per-file thresholds. Typecheck, lint and the application build pass.

A targeted Electron UI test opened a function project, executed the indicator worker, saved and reopened the real project file, then ran the robot worker to completion. This source-build test passed (one test); it does not replace the full E2E suite or installed-build acceptance. An initial attempt was interrupted after identifying an incorrect navigation selector in the test; the corrected test passed.

This supersedes the earlier integration limitations in WIP-FUNCTION-GENERATION.md and WIP-FUNCTION-ROBOT.md. Lesson L11, localized function block labels, full regression E2E, and updated installer packaging remain outstanding. Release 0.5.0 artifacts are unchanged and contain none of this unpublished work. Physical hardware verification remains NOT RUN.
