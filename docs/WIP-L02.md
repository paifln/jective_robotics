# Source changes after the 0.2.0 release

The published 0.2.0 installer and source ZIP remain the tested two-lesson snapshot. Current working-tree source adds L02 in English, Kazakh and Russian, with a six-role component inventory and power-path worksheet. It contains 634 English learner-facing words, three assessment questions and a real JSON export form. Unfilled specifications stay absent rather than being invented. Translations require technical language review.

Verification: strict TypeScript and ESLint pass; all 27 unit/integration tests pass. An Electron test opens L02, enters observed markings and unresolved questions, exports via the actual Electron download event and reads the resulting JSON file. It verifies that an unfilled documented-specification field is absent. This test passed against the rebuilt working-tree app, not the published installer. Reports are preserved in `evidence/wip-l02` without replacing published-release evidence.

The initial export test incorrectly waited for a browser download event and timed out. The corrected test uses Electron's session `will-download` event to choose an isolated destination and checks the real file. The application export code did not need a change.

Content validation still reports NOT COMPLETE: three authored lessons out of sixty; 57 remain missing and translations remain drafts. Worksheet edits are held in the page state and must be exported before leaving the page. No hardware connection, upload or physical verification was performed for this worksheet. Release artifacts and their checksums have not been changed.
