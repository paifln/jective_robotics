# Telemetry labels and sample-table access

The telemetry panel now localizes unknown-unit text, rejected/dropped counts, sample-table controls and headers in EN/RU/KK. The graph refers to its localized clock/provenance explanation via `aria-describedby`. Received sample locations have explicit markers; a bounded expandable table provides receipt timestamps, sequence numbers and exact values with column headers and a metric/unit caption.

TypeScript and ESLint passed. The updated Electron scenario verified five actual injected test-fixture samples in the table, English headers, Kazakh headers/export control after changing language, and Russian headers/export control after a second change. Its existing plot, actual CSV export and extreme finite-value checks also passed. The transport fixtures remain explicitly confined to automated tests; physical hardware was not used. Report and screenshot are preserved in `evidence/wip-telemetry-accessibility`.

This is a targeted source-app check, not a complete screen-reader/keyboard/contrast or technical-language acceptance audit. Other application prose and controls remain incompletely localized. Published 0.2.0 artifacts are unchanged; the overall specification remains unfinished.
