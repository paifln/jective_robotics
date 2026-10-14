# Parameterized function interpreter — unpublished work

The separate `FunctionProgram` now executes in an indicator-only interpreter. Calls evaluate arguments in the caller, then establish a fresh parameter frame. Parameter assignments stay local; other assignments affect shared globals. Nested callees cannot read caller parameters implicitly. Frames restore even after execution throws. A shared instruction budget bounds empty calls and loops, and the duration cutoff stops further events.

Five tests cover separate call sites with 0, 100 and 60000 ms arguments, nested calls and variable scope, empty-call and loop budgets, branching and duration cutoff, division by zero, invalid waits and unsupported hardware operations. Typecheck and lint pass. The full suite passes 126 tests; aggregate branch coverage is 965/1048 (92.08%), and the new interpreter has 96.22% branch coverage. Existing per-file branch thresholds remain enabled.

This is groundwork, not an available Studio feature. Blockly, robot simulation, persistence and lesson L11 do not yet accept this separate function model. Generated Arduino C++ support has since been added; see WIP-FUNCTION-GENERATION.md. Release 0.5.0 artifacts are unchanged and do not contain this unpublished work. The master prompt is still incomplete.
