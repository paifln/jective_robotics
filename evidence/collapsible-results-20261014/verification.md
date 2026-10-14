# Collapsible Studio results

Added icon-only localized ResultsToggle with expanded state. Collapsing hides result content while retaining its DOM/log/journal state; expanding restores it. New log/busy changes reveal results, simulator start explicitly reveals them, and privileged-operation errors reveal them even when their text repeats.

Initial state test failed on identical repeated simulation text: effect dependencies did not change. Fixed explicit operation-start reveal, retained failure. Corrected two-test Studio/desktop design run passed. Follow-up real canceled-Save-dialog fixture checks repeating the same SAVE_CANCELLED error reveals the collapsed result; passed. Tests also assert exact preserved log text, hidden/visible states and aria-expanded. Build/typecheck/lint passed.

Source-only renderer/CSS change. Immutable persistence-polish package and its minimal real compiler proof unchanged; no new package/installer/physical verification. This does not claim all keyboard/screen-reader or every operation's collapse behavior.
