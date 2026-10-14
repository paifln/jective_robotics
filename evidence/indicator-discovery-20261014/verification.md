# Indicator experiment discoverability

Moved existing collapsed indicator experiment controls out of the Result section into a compact independent Studio disclosure. They are reachable before any output exists; generation, simulation cancellation/export conditions and copy conversion remain unchanged.

Build and two source Electron tests passed: current studio smoke launches the indicator experiment directly without forcing a canceled Save dialog; its real trace contains the expected 500ms LED transition. Desktop design checks passed both themes, expansion, menu collapse, localized tooltip bounds and 800x700 containment. Dark 800px screenshot visually reviewed. The additional disclosure reduces the available small split-editor height; single-pane and Expand editor remain available.

Source-only change, not a new production artifact. Physical indicator/board, installer and Windows 10 verification not performed.

Visual review found a legacy max-width 1050px rule hiding the disclosure. Overrode it explicitly for the independent Studio control and added an 800px visibility assertion. Rebuild and both source tests passed again (compact-ui.json); latest narrow screenshot reviewed and replaced with corrected view. Typecheck/lint passed before this final CSS and test-only follow-up.
