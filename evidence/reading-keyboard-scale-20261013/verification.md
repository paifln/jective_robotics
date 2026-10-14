# Reading controls keyboard and native zoom

Opening reading settings focuses the first control. Escape dismisses and restores trigger focus. Moving keyboard focus outside dismisses the popover. The trigger references its unique panel ID. Small-screen popovers use a bounded, scrollable position above bottom navigation.

Two source Electron tests PASS: actual webContents zoom factor 2, a native 1000x800 test window, Enter/Space activation, text-size change, spacing toggle, Tab reaching playback speed inside the scrollable panel, viewport and bottom-navigation bounds, Escape and outside-focus dismissal; existing lesson animation visibility/minimize regression. Typecheck, lint, build PASS. Native capturePage screenshot manually inspected (native-200-percent.png).

Earlier attempts found the original popover could overlap bottom navigation; this was fixed and regression bounds added. Playwright screenshot initially captured a blank crop at native zoom, so the final visual evidence uses Electron capturePage. Earlier failing runs remain in .verification/reading-keyboard-scale-*.json.

This verifies one lesson-control workflow at 200 percent, not full product accessibility or screen-reader acceptance. No fresh packaged EXE made for this change; current-source-workspace-messages-20261013 is the preceding immutable package.
