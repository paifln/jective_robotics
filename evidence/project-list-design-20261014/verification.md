# Project list design

User delegated design direction: balanced calm desktop controls with playful educational visuals.

Long project titles now use single-line ellipsis and preserve the full native title on desktop; narrow screens wrap titles. Existing date and action controls remain. Intro accurately explains separate-file saving without claiming ordinary opening creates a copy.

Source Electron project-list and reading-design tests: 2 passed, 0 failed. Project fixture contains 20 saved projects; searches full names and checks 800px and 480px layouts. Screenshot visually reviewed. Typecheck and lint passed. Build passed before these tests.

Known existing limitation: workspace state returns only the most recent 20 projects, and My projects currently searches that subset. This test does not prove browsing older projects. A dedicated paginated browser remains work to do.

Changes are source-only; the user's running preview and previous immutable package were not replaced. No installer, hardware, Windows 10, or full accessibility verification is claimed.
