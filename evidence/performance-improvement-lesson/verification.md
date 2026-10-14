# Registered L58: measurable performance improvement

Post-release source only. Catalog now has 58/60 draft lessons. Published installer 0.8.18 remains immutable and excludes these changes.

L58 has six substantial explanation paragraphs in English/Russian/Kazakh, a worked numerical comparison, guided and independent studies, troubleshooting, safety, age/time adaptations, three explained questions and a 0–4 peer rubric. The content validator counts 1027 English learner words. It explicitly names accuracy as the objective and +720 ms as its cost, keeps acceptance fixed, explains radians versus displayed degrees, deterministic repetition and physical evidence limits. The lab shows a condition-comparison diagram before running and actual paired paths afterward. Hypothesis input was widened to a readable full-width field.

Checked evidence selection and knowledge questions assess fixed rules, one changed parameter, the accuracy/time tradeoff and the absence of physical measurements. Validated learning record/backup IDs, worksheet and exact Studio starter/default reference are registered. The lab runs supplied programs; arbitrary edited C++ is not secretly executed. Full model/measurement limits are in `../performance-improvement-foundation/verification.md`.

Actual verification on Windows 11:

- Full unit/coverage: 493 tests / 169 files passed; 96.48% branches, all required per-file gates pass. Typecheck/lint/build passed. Added test covers trilingual lesson/registration, wrong/correct conclusions, two-attempt SQLite record with exact backup restoration, and both real simulator artifacts completing without collision.
- Four source GUI scenarios passed: normal L58 catalog/model/download/grading/Studio saves, mounted lab validation/480px/three languages/themes, normal L57 and broader learner navigation through all 58 introductions.
- Normal L58 GUI saved two distinct native project files. Their actual Blockly workspaces were restored headlessly and converted back to the exact authored programs. Each saved program then ran three actual RobotSimulation trials; recomputed measurements matched the corresponding lab report exactly. Native SQLite retained the checked conclusions through navigation. No file-save implementation or learning IPC was mocked; predetermined dialog paths belonged to an isolated test-owned workspace.
- Fresh final normal/mounted L58 GUI checks passed after the hypothesis field was widened. 800 px light/dark normal screenshots were inspected: readable full-width textarea, header clear of sticky controls and no horizontal document overflow. Actual report, saved project files and screenshots are beside this note.
- A genuine missed translation defect in L57 was found: its heading had literal question marks after a Unicode shell-pipe write. Corrected using ASCII Unicode escapes; a fresh normal L57 GUI test now asserts the exact Russian/Kazakh heading. The source question-mark scan is clear. Earlier broad passes did not prove this heading was correct; this new evidence does.

Machine reports/source hashes: `.verification/performance-improvement-lesson/` contains the four-scenario report, fresh L57 heading report, final two L58 checks, unit/coverage and content status.

Content gate remains **NOT COMPLETE**: L59/L60 and independent human technical translation review remain pending. This lesson did not compile, upload or measure a physical rover. Windows 10, clean installer lifecycle, live OpenAI and full packaged learner verification are NOT RUN. Additional architecture/security/master acceptance and a new installer release remain required.
