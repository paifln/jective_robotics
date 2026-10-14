# Logical NOT

Source adds a `not` expression and a Blockly NOT block. It accepts the existing numeric expression inputs and yields one for zero, zero for nonzero. Blockly import/export, both simulators and generated C++ support it. The expression nesting bound includes NOT; operand errors are preserved rather than inverted into a valid Boolean.

Unit tests cover real Blockly serialization, zero/positive/negative/fractional operands in both simulators, nested expression limits and division-error propagation. The expression host/ESP32 check now includes valid NOT cases; the expression-order host check includes NOT of division by zero and overflow, for twelve total cases.

L09 is not authored yet. Its button and sensor decision-table exercise still needs implementation and testing. This capability is a prerequisite, not an additional lesson. It is a source change after the published 0.3.0 artifacts; physical upload remains NOT RUN.
