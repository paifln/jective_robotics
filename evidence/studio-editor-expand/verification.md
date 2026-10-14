# Studio editor expansion

Added a localized, keyboard-accessible expand/restore button beside the editor layout selector. Expanded Program view hides component cards and project settings and increases the editor area. Compile, USB board upload, pane navigation and compiler output remain available. Connections retains its normal controls. Blockly's existing ResizeObserver and Monaco's automatic layout handle the size change.

Actual source Electron UI verification passed. It checks editor height increases, hidden/restored controls, the saved icon-rail preference, genuine changed-source save activity (unchanged saves do not count), board upload dialog and port discovery, twelve simulator maps without old program presets, student chat without provider/settings/context-preview controls, and 800px light/dark layout containment. No physical upload was performed. Screenshots of normal and expanded layouts were inspected.

An initial UI test exposed that flex sizing prevented the editor growing. The layout was corrected; the initial failed receipt is retained separately. Final typecheck, lint and build passed. The full unit suite passed 457 tests, with 96.70% branch coverage (including the separate offline review foundation).

These changes are in source/build only. Published installer 0.8.16 is unchanged. Existing user-owned Electron windows were preserved; they retain their already loaded renderer until restart. Physical ESP32/JECTIVE operation, Windows 10, clean installer lifecycle and live OpenAI verification remain NOT RUN.
