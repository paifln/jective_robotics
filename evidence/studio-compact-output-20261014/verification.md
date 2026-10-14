# Compact Studio result access

Reproduced 800x700 failure: expanded indicator experiment ended at y801.16 beneath bottom navigation y638. Result/experiment controls now enable internal Studio vertical scrolling; output has its own bounded scrolling and does not shrink away. Components and editor remain present.

Build and two source Electron tests passed. Compact smoke scrolls experiment and actual indicator result into view below y638, checks editor height at least 180px and no document overflow, then retains conversion/editing/provisional-board assertions. Desktop themes, menu/editor expansion and localized tooltips passed. Result screenshot visually reviewed. Before failure and after success retained; scrollIntoView tests accessibility by scrolling, not simultaneous visibility of every panel.

Source-only change. No production package, installer, Windows 10 or hardware verification.
