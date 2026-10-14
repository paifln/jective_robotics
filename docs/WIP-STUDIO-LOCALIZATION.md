# Studio dialogs and verification labels

Studio confirmation dialogs now follow the selected locale for opening another project, creating a new project, local-copy and lesson loading, reviewed AI source application and Blocks-to-Code conversion. Recovery confirmation uses the locale just loaded from persistent preferences, avoiding the initial English React state. Conversion preserves the existing independent-code behavior and original blocks.

Compiler/physical/upload verification captions, NOT RUN labels, hardware compiler caption, original-block and generated-preview headings, and the indicator-only motor notice have Russian and Kazakh translations. Technical compiler logs and machine states remain unchanged.

Two real source Electron scenarios passed: Russian/Kazakh conversion confirmation text, dismissal/acceptance behavior, verification labels and preserved block heading; and the existing English studio generation/conversion/isolation scenario. Type checking and lint passed. This does not establish complete UI localization, native-main-process dialog localization, translated Blockly labels or educator translation review.

Changes are after published 0.4.0 and have not been packaged into that installer. The E2E report is retained in evidence/wip-studio-localization/e2e.json.

Further source localization includes the first-run welcome using the persisted locale, saved-revision and pending-edit messages, compiler-start/result/stale-revision captions, human-readable build states, unsaved/saved status, development-build badge and indicator simulation tooltip/interruption. Raw CLI diagnostics and machine error identifiers remain intact. The expanded source Electron test checks Russian and Kazakh dirty-status text and the development badge; it and the English studio scenario passed again. Type checking and lint passed. The report is retained separately in evidence/wip-studio-status-localization/e2e.json.
