# Localized compact command tooltips

Current source Electron design test PASS. In addition to all five surfaces/both themes, collapsed navigation, editor expansion and 800x700 bounds, the test now selects Russian and Kazakh in the actual header and hovers each localized Compile command. Tooltip accessible text matches the localized command, and actual DOM rectangle remains inside the 800px viewport and above the bottom navigation.

Typecheck/lint PASS. No production source changed; this adds evidence for the existing bounded tooltip styling and genuine locale selection. User preview and published/package binaries unchanged. This is a tooltip/navigation check, not a complete translation or human usability audit.
