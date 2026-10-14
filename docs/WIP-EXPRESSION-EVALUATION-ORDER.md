# Generated expression evaluation order

Generated binary expressions now evaluate their left operand before their right operand inside a scoped C++ lambda. Each evaluation checks the arithmetic fault latch before proceeding. Logical AND/OR explicitly short-circuit after a successful left evaluation. This matches the simulator's left-to-right error behavior and avoids relying on C++ function-argument evaluation order.

`node scripts/expression-order-check.mjs` compiles and executes ten generated programs with explicit host Arduino stubs. The cases pair division by zero with overflow in both orders across addition, division, comparison, AND and OR. They assert the first message, single error reporting, no assignment, and no subsequent loop assignment. These are software checks, not board observations. The existing expression compiler check additionally tests valid division and short-circuit behavior and compiles for ESP32.

Cross-platform extreme floating-point values remain a review item. No physical upload/on-device validation has been performed. This change is in source after the published 0.3.0 artifacts.
