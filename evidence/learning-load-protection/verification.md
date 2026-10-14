# Protect existing learner answers when loading fails

Source-only post-release change; installer 0.8.18 remains unchanged.

General learning exercises and the L49 requirement matrix, L51 communication record and L55 mission proposal now share one cancellable loading hook. A failed Result or rejected load keeps editing, checking, saving and form exports disabled. A localized explanation and explicit retry button remain outside the disabled fieldset. A successful empty read permits a new form; a successful existing read restores its answers. Changing an exercise ID immediately makes the old loading state ineligible, and unmounted reads are ignored.

Actual verification on Windows 11:

- Typecheck, lint and build passed.
- New Electron GUI test passed using real learning IPC and SQLite. It first saved four records, replaced their isolated database values with invalid JSON, verified four failed-load notices and every form control disabled, restored the exact records, retried each load and verified the original mission text and complete records, including attempts and timestamps, were unchanged. No simulated load Results or save implementation were substituted.
- Five broader source GUI scenarios passed: normal L55 save/download/restart, L49 catalog/persistence, L51 investigations, all 56 lesson introductions/themes/Studio/simulator, and actual compiler wizard success/error/stale-upload checks. These passes are in a mixed-run report whose added fault test initially failed on a test locator; the corrected fault test has its separate passing report.
- Domain code was unchanged this turn. The preceding full domain run remains 478 passing tests / 166 files / 96.56% branches; it is not represented as a new run of the UI changes.

Reports and source hashes: `.verification/learning-load-protection/`. Initial test-only failures are retained: Electron evaluation lacked a global `require`; Playwright does not treat a fieldset itself as a disabled control; selectors initially included the hidden original application; positional retry-button locators became invalid as completed forms removed their buttons. The final test uses built-in Node module access, checks actual controls, scopes its mounted forms and reselects the remaining retry button.

The dedicated mounted-component test temporarily hides the normal root but uses the shipping form components, native IPC and database in an isolated test-owned application. The broader checks exercise normal catalog navigation. Windows 10, physical hardware, clean installer lifecycle and this change in a packaged learner workflow remain NOT RUN. Course remains 56/60 drafts and full master acceptance is incomplete.
