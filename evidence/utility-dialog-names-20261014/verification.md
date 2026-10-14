# Named Help and board-run dialogs

Help and Run on board native dialog elements now have localized accessible names (EN/RU/KK). Source Electron tests passed: Help accessible name asserted in EN and KK search journeys, board-run accessible name asserted in RU together with port selection and disabled upload state. Existing foundations answer/adaptive-help and Studio localization assertions passed. Build passed; typecheck/lint checked afterward.

This checks DOM accessible names, not real screen-reader certification. Board-port fixture does not verify a physical device or upload. Changes are source-only, latest immutable package predates these labels.
