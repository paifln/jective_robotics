# Expression-based waiting

The source adds a separate `waitValue` instruction and Blockly block accepting a numeric expression in milliseconds. Existing constant wait blocks remain readable. Variable and arithmetic expressions survive Blockly serialization, lower into generated C++, and execute in the indicator and robot simulators.

Evaluated durations must be finite whole milliseconds in the inclusive range 0–60000. Simulators report `WAIT_RANGE`; the robot simulator stops through its existing error handling. Generated Arduino code prints `WAIT_RANGE`, does not call delay, and returns from the current setup/loop invocation when invalid. A subsequent loop invocation can report the error again. This is a blocking Arduino delay for nonmotor exercises, not a cooperative motor runtime.

Tests cover three timing values in both simulators and actual Blockly round trips, plus invalid negative, fractional and excessive values. `node scripts/variable-wait-check.mjs` executes the generated C++ with an explicit host delay stub, including NaN/infinity rejection, and compiles it with the pinned ESP32 toolchain. Its detailed report is `test-results/variable-wait/verification.json`; physical upload is NOT RUN.

L07 is still pending. This change supplies a prerequisite for its required working parameterized program; it does not count as an authored lesson. It is not included in the published 0.3.0 artifacts.
