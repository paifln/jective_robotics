# Named lesson photo dialog

PhotoViewer now associates its dialog with the displayed localized heading through a stable React useId/aria-labelledby relationship. Source Electron reading test asserts the motor dialog accessible name, 480px containment, Escape close and focus restoration to the original Enlarge image button. One test passed; native dialog focus restoration remains in use, no custom focus override added.

Build passed. Typecheck/lint checked afterward. This is source-only and does not certify real screen-reader behavior or all accessibility requirements; the immutable design-polish package predates this change.
