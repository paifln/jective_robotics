# Foundation navigation and answer protection

Foundation lesson selection and previous/next actions now focus the new lesson heading without scrolling the old focused button back into view. Existing article navigation still scrolls to the new lesson. Headings are programmatically focusable and preserve existing focus-visible styling.

Three actual source Electron tests PASS: foundations and persisted locally checked answers; corrupt saved-record protection across four educational forms with editing disabled until successful retry and existing records unchanged; keyboard reading controls at native 200 percent zoom plus heading focus after selecting and advancing a foundation lesson. The help/circuit assertions exercise UI and profile data, not physical wiring.

Typecheck, lint and build PASS. The earlier run passed read protection but failed an obsolete solid-blue background assertion. The current selected-row design uses an accent text/edge on field background; the assertion now checks the actual accent text. Earlier report retained. No learner safety check was removed.

No new packaged snapshot for this small heading-focus change. current-source-reading-access-20261013 is the preceding immutable package. Full curriculum language/technical certification and physical hardware verification remain unavailable in these tests.
