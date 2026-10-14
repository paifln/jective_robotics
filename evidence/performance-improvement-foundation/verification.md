# L58 performance comparison foundation

Source foundation, not yet registered as a complete lesson. Course remains 57/60 drafts; immutable published installer 0.8.18 is unchanged.

Reuses squareRouteTrials and the actual robot-world simulator. The default comparison changes only turn duration from 1000 to 1180 ms. Same world, motor duty, straight duration, geometry, repetition count and acceptance rules are retained. Acceptance requires completion, no collision, endpoint error at most 2 cm, every corner error at most 0.05 rad, final heading error at most 0.1 rad and completion at most 13,000 ms. Measurements are recomputed from full sampled trajectories instead of accepting a supplied summary or pass flag. Closure alone cannot satisfy the corner checks.

Actual default observations: endpoint error about 8.87 cm before and 0.09 cm after; worst corner error about 13.61 degrees before and 0.15 degrees after; observed completion 9620 ms before and 10340 ms after. Improvement is accuracy within the unchanged time budget, at a measured cost of 720 ms. The displayed values are rounded; full unrounded measurements and traces are retained in actual-comparison.json. Three repetitions per version run identical deterministic conditions, not independent physical experiments or confidence estimates.

The panel requires a bounded hypothesis, accepts a bounded turn duration in 20 ms steps, clears obsolete results on edits and refuses to call an unchanged/inaccurate candidate an improvement. Text length is only a structural check; hypothesis quality still needs discussion. Paired first-trial paths use one shared scale and show endpoint tolerance; all six trials appear in the table and export. Labels distinguish turn duration from overall completion time.

Verification on Windows 11:

- Full run: 492 tests / 169 files passed; 96.48% branch coverage, required per-file thresholds passed. Typecheck, lint and build passed.
- Domain tests cover unchanged/bad candidates, fixed strict acceptance, actual paired worlds and tradeoff, fabricated summaries ignored, collision/time/phase corruption and duplicate trial IDs rejected.
- Mounted shipping-component Electron GUI test passed: input validation, unchanged candidate rejection, actual successful comparison, six measured rows, same-scale SVG, real native report download and independent reinspection of downloaded trajectories. 800 px light/dark and Russian/Kazakh screenshots retained; 480 px overflow check passed. Light screenshot inspected for readable trajectories/table.
- A readonly fixture-summary TypeScript assignment was corrected before final checks; no passing typecheck was claimed for the initial attempt.

Machine reports/source hashes: `.verification/performance-improvement/`. Actual model export and screenshots are beside this note. The GUI fixture hides the normal root and mounts the shipping panel in an isolated test-owned app; it is not normal catalog verification.

Next: substantive L58 lesson, checked reasoning/knowledge, learning record/backup registration, exact Studio artifact and normal catalog GUI. No student-edited C++ compilation, upload, hardware motion, physical accuracy/statistics, Windows 10 or packaged verification was performed. Full master acceptance remains incomplete.
