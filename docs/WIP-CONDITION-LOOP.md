# Bounded condition loop

Source adds a Blockly condition loop with an explicit iteration budget from 1 through 1000. The IR `while` instruction carries its condition, body and `maxIterations`. Both simulators and the C++ generator evaluate the condition before each iteration. A false condition exits normally, including immediately after the last allowed iteration. A still-true condition at the limit reports `LOOP_BUDGET` before another body execution.

The robot generator yields an instruction at each iteration, including empty bodies, so the outer instruction budget can interrupt work. Indicator loops also account for each condition iteration. Existing nesting and total instruction limits include the new body. Generated C++ uses its existing fault latch and returns before following instructions on exhaustion; this is not a motor safety runtime.

Tests cover actual Blockly serialization, three correctly timed iterations ending at 300 ms, an empty permanently true loop, exclusion of an unreachable instruction and invalid iteration budgets. `node scripts/while-check.mjs` executes generated C++ for normal and fault exits with explicit Arduino host stubs and compiles the normal loop for ESP32. Physical execution remains NOT RUN.

L10 is not yet authored. This capability is a prerequisite and does not add to the nine-lesson count. It remains a source change after published 0.3.0.
