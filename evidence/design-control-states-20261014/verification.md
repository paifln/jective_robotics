# Control visual states

Shared focus-visible outline now follows semantic theme accent, including summary/link/textarea controls. Disabled buttons use a readable muted neutral surface at 0.65 opacity with not-allowed cursor; native disabled property and business conditions are unchanged. Primary color no longer suggests a disabled command is ready.

Three design/localized-board/reading Electron regressions PASS; two additional asserted regressions PASS: focused reading select renders 2px brand-color outline during native 200 percent keyboard flow, and unavailable upload button remains disabled and renders 0.65 opacity. Typecheck/lint/build PASS. These are scoped visual/functional checks, not a full accessibility certification.

Changes currently source-only. No updated production package or user-preview restart in this turn. Previous reading-polish EXE remains the latest immutable package. Optional design direction question pending; existing calm desktop chrome and playful educational assets retained meanwhile.
