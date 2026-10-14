# Function calls in robot simulation — unpublished work

`RobotSimulation` now also accepts a validated `FunctionProgram`. A generator holds each parameter frame across yielded instructions and tick boundaries; nested calls restore their caller frame. Parameters are passed by value, assignments to parameters stay local, and other variables remain global. Call arguments use the current world's sensor values. Each call yields a zero-time scheduler instruction so empty-call loops remain bounded by the per-tick instruction limit. Exceptions retain the existing fail-stop behavior of virtual motors.

Three new tests check nested waits and parameter/global isolation, a simulated button controlling motion intent, empty-call instruction-budget exhaustion, and a callee's invalid wait stopping virtual motion. The full suite now passes 131 tests; aggregate branch coverage is 988/1072 (92.16%), with existing per-file thresholds preserved. Typecheck and lint passed after integration. This verification is simulation only; physical sensors and motors were NOT RUN.

Evidence is in `evidence/wip-function-robot/`. The earlier function generation reports remain scoped to their 128-test snapshot. Blockly, persisted workspace integration and lesson L11 remain outstanding. No updated installer has been produced.
