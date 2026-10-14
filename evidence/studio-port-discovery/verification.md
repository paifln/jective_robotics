Source verification, 2026-10-11

StudentBoard discovers USB ports on mount without requiring a refresh click. Selection remains explicit; discovering a port does not identify or upload to a board. Late initial responses are ignored after unmount or locale changes.

Dark Studio neutral controls use theme colors while primary and selected controls retain their existing styles. The Studio screenshot test waits for the theme transition and asserts the neutral action background.

Typecheck, lint and source build passed. Full unit suite: 418 passed, 0 failed; branch coverage 96.52%. Two source Electron UI scenarios passed: Russian/Kazakh commands, automatic discovery with an explicitly labeled fake port, independent Code copy; and persistent icon rail, saved-code calendar, upload dialog, simulator maps and learner assistant. The final contrast-specific rerun passed; light/dark screenshots were inspected.

initial-ui.json preserves the initial failed obsolete localization test. ui.json records the corrected two-scenario run. contrast-ui.json records the final one-scenario rerun after waiting for theme completion. No physical upload occurred. No live OpenAI call, Windows 10, installer lifecycle or new installer verification occurred. These changes are in source; the immutable 0.8.13 installer predates them.

L47 source registration was also completed and its invalid intro visual identifier corrected. The unit suite covers its model, criteria, reports, activity, persistence and lesson draft. Registered L47 navigation/export workflow remains unverified; the released 0.8.13 course remains at 46 lessons.
