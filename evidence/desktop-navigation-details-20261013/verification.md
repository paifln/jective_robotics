# Compact navigation detail

Menu toggle now uses a directional SVG and a title reflecting the next action (collapse/expand), localized EN/RU/KK. Studio command tooltip aligns inward and wraps to a bounded width. Action buttons retain their accessible label and custom hover/focus tooltip; native title removed there to avoid a duplicate tooltip. Collapsed navigation retains native localized titles for icon-only sections.

Source Electron design test PASS: all five surfaces in light/dark, sidebar collapse and icon-only navigation, expand title and restored collapse title, actual compile tooltip within viewport, editor expansion, 800x700 bounds and genuine dark Blockly background. Build PASS; typecheck/lint passed before the final redundant-title removal, with final source rendering verified by the test.

No new package for these small details. The user's responding preview PID5920 was left intact; its current-source-desktop-design-r2-20261013 binary predates this detail change. Source and package are intentionally distinguished.
