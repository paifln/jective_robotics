# Shared simulator expression errors

Both simulators now use one expression evaluator. It rejects nonfinite intermediate results with `EXPRESSION_RANGE` and evaluated zero denominators with `DIVISION_BY_ZERO`. Logical operators preserve short-circuit evaluation. Previously the indicator interpreter could accept arithmetic overflow which the robot simulator rejected; wrapping an overflow in a comparison could conceal that difference.

New tests exercise direct and comparison-nested errors in both simulators and assert failed assignments do not commit a result. Existing timing, motion, content and short-circuit tests remain in the suite.

This change addressed simulator consistency. Subsequent generated arithmetic fault handling is documented in WIP-GENERATED-EXPRESSION-FAULTS.md; the original native division/overflow behavior has since been replaced. These remain source changes after the published 0.3.0 artifacts.
