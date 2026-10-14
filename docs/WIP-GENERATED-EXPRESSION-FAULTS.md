# Generated arithmetic faults

Generated nonmotor Arduino sketches now check arithmetic results for finiteness and zero denominators. The first evaluated arithmetic error prints `EXPRESSION_RANGE` or `DIVISION_BY_ZERO` and latches `j_expression_error`. Assignment evaluates into a temporary and checks the error before changing its destination; condition evaluation checks the error before executing either branch. Later setup/loop invocations return while the latch remains set. There is no UI command clearing the latch on hardware.

This preserves ordinary double-valued arithmetic and logical short-circuiting. It supplies no motor shutdown guarantee; motor generation remains unsupported. Runtime handling of invalid wait ranges remains separate from the arithmetic latch. Subsequent left-to-right operand fault handling is documented in WIP-EXPRESSION-EVALUATION-ORDER.md. Cross-platform extreme floating-point values still need review.

`scripts/expression-check.mjs` checks actual generated C++ using explicit Arduino host stubs, including arithmetic fault latching and prevention of later assignment, and compiles the source using the pinned ESP32 toolchain. Unit tests and the L06/L07 Electron checks cover ordinary execution. No physical upload or on-device fault test has been performed. This source change is not in the published 0.3.0 artifacts.
