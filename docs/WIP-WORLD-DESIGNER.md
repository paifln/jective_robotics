# Practice-area designer — source only

The simulator now has a collapsed practice-area designer. Students can change area dimensions, robot position and heading, goal and rectangular obstacles, inspect a pixel preview and explicitly apply the area. Applying stops the current simulation and invalidates pending worker responses; it never starts a program automatically. Invalid or overlapping geometry disables application and export.

Straight-motion predictions use the existing simulator drive model with fixed steps. They do not execute student code or verify physical hardware. JSON exports label metres, radians and event times in milliseconds, plus the top-left screen coordinate frame. Advanced scenario tools accept both this versioned document and existing raw world JSON, validating the complete input before replacing the world.

Source verification: 373 passing unit/integration tests, 96.31% branch coverage with unchanged per-file thresholds, typecheck, lint and build. Final Electron checks cover Studio's icon rail, changed-code save activity, USB upload dialog and student assistant, plus designer validation, stopping a running simulation, real export/import and 800px light/dark layouts. Earlier four-scenario compatibility evidence predates the time-unit label correction. See [receipt](../evidence/world-designer/verification.json).

This increment is not included in the immutable 0.8.9 installer. L43 is not registered; curriculum remains 42/60 draft lessons. First-class world file selection, project-owned world persistence, L43 adaptive lesson tasks and the remaining curriculum are still required. No physical upload, Windows 10, clean installer lifecycle or live OpenAI verification was performed.
