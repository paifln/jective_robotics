# L57 reliability laboratory foundation

This is implemented/tested source foundation, not yet a registered complete lesson. Catalog remains 56/60 drafts; published installer 0.8.18 is unchanged.

The experiment reuses the existing SafeMotorModel and RobotSimulation. Tethered communication loss is represented by stopping heartbeats, with observed disarming/zero output at 400 ms. Reset is a fresh model instance, with a separate zero-based clock and refused movement before arming. Invalid distance uses a real out-of-range input, producing an actual starter error and an explicit stop after validity checking is enabled. Blocked movement supplies a deliberately incorrect clear-distance override next to an actual modeled wall; it collides. The repaired experiment removes that override and uses actual ray geometry, stopping without contact. This repairs model input configuration; it does not implement or claim encoder stall detection or physical sensor calibration.

Original failures, full programs/worlds/actions/traces, issue IDs and all four retests are retained together. Reviews inspect actual trace states, latch/reason/input provenance, collision and output conditions; they do not use canned success flags. The supplied lesson comparison executes its own bounded models, not arbitrary edited student source. No hardware API is invoked.

Verification on Windows 11:

- Full domain run: 488 tests / 168 files passed, 96.49% branch coverage, required per-file thresholds passed. Typecheck/lint/build passed.
- Tests reproduce the two original failures and four successful retests, reject missing timeout observation, reset motion acceptance, wrong provenance, missing latch/reason, collision and invalid configuration.
- Actual source Electron mounted-component GUI test passed: four comparison rows/two issues, actual native download, independent reinspection of downloaded traces, all three languages, 800px and both themes. Light/dark screenshots inspected; readable table with no horizontal overflow. Full actual model report/screenshots are beside this note; machine reports/source hashes are in `.verification/reliability-review/`.
- The initial failed test revealed an incorrect distance-status spelling (`out-of-range` instead of existing `outOfRange`); it was corrected. Initial tuple typing was corrected without changing recorded observations. The initial failure report is retained.

Remaining L57 work: substantive localized lesson explanation/worked example/tasks/assessment/rubric, catalog/lab registration, learner activity persistence, worksheet and normal catalog GUI verification. Communication is a model authority-timeout test, not USB disconnect; reset is not an MCU reset; modeled blocked path is not motor stall detection. Physical runtime/reset/communication/motor safety, Windows 10 and packaged deployment remain NOT RUN. Independent human content/translation review and full master acceptance remain pending.
