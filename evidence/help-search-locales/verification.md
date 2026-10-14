# Help locale and Escape recovery

Expanded actual Electron Help search checks cover body-only journal phrases in EN/RU/KK. A new domain regression verifies title matches precede body-only mentions and equally ranked results retain authored order; all3search tests pass.

Initial GUI run failed: native search-field Escape cleared nonempty query without closing Help. Failure preserved in initial-escape-failure.json. Search-field capture handler now closes Help on Escape and prevents the competing native search-clear action; composing IME events are excluded. Rerun5.2s passes allthree locale lookups/one-Escape closing plus prior foundations/help workflows. Build/typecheck/lint pass. Actual IME composition, full human screen-reader/scaling, installed/package and hardware checks were not performed; no broad domain/compiler rerun for this renderer fix/test expansion.
