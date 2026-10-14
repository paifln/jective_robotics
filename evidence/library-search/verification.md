# Localized empty-search recovery

Library search now has localized EN/RU/KK accessible names and an announced no-results message with recovery advice. Empty material panes are hidden from actual result count; choosing the suggested lesson clears the filter and focuses its heading.

Initial UI check found the empty layout remained visible with the CSS empty-aside selector. Failure preserved in initial-empty-pane-failure.json. Replaced it with an explicit hidden result-state attribute and scoped CSS. Source Electron rerun8.0s PASS: no-results/hidden-layout/clear-filter/focused-heading, RU/KK accessible input names/messages, existing real grading/rejection/progress/restart/freechoice/800px light-dark checks. Typecheck/build/lint PASS. Renderer-only; no full domain, compiler/package/hardware rerun. Not human screen-reader or complete manual full-text-search acceptance.
