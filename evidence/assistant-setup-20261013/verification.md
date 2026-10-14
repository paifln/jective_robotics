# Assistant setup error recovery — 2026-10-13

Source UI now catches settings-load and save IPC/validation rejections. Save failures show a localized recovery message without echoing provider/backend details or entered credentials. Inputs are disabled while saving; failed entries remain available for retry; successful saves clear the password field. Settings-load updates are guarded after unmount.

Verification: `npm run typecheck`, `npm run build`, `npm run lint` passed. `npx playwright test tests/e2e/assistant-setup-errors.spec.ts` passed (1 test, 5.8 seconds). Isolated source Electron profile: an intentionally invalid configure response rejected through the real preload validator; UI showed recovery, retained the dummy password and enabled retry, with no observed pageerror. After restarting the isolated application to restore production handlers, a dummy key was saved by the real AssistantService and Windows safeStorage; stored JSON did not contain the dummy plaintext and settings reported configured. No provider request was made. This does not establish encryption strength, live model access, or packaged/installer acceptance.

Two initial test attempts failed: immediate main-process instrumentation before window readiness obscured the initial error with a cleanup exception; the next attempt expected English Help in a fresh Russian-default profile. Test now waits for the window and selects English explicitly. These were test corrections, not proof of product behavior. Final machine report is retained alongside this note.

The user-facing production snapshot remains open (PID 8928 observed responding). It predates this source-only change; no restart, package replacement or installer overwrite was performed.

## Follow-up: concurrent configuration and learner refresh

A real filesystem regression test reproduced ENOENT renaming the shared temporary config file across thirteen concurrent updates (`concurrent-before.json`). Configuration now queues validated/copied updates per AssistantService instance; each update reads the latest committed key. All thirteen completed, model-11 and the previously encrypted dummy key remained configured, and a rejected insecure-endpoint update did not block the next valid update (`concurrent-after.json`). Encryption in these domain tests is an explicitly mocked adapter, not DPAPI evidence. Cross-process editing of the same configuration file is outside this test.

Learner settings refresh now immediately disables requests, catches rejected preload validation, uses localized local-hint recovery text, and ignores superseded responses. The focused Electron suite passed all three tests in 13.4 seconds: failure/refresh recovery with explicit settings and answer fixtures; actual local dummy-key save after restart; existing multi-file review consent, stale-source safeguards and cancellation. No live AI provider or device command ran. The refresh test covers invalid settings and subsequent recovery; the superseded-response guard has not yet been directly exercised by a deliberately reordered response test.

Final typecheck/build/lint passed. Full domain suite: **539 tests in 182 files passed**, 27.84 seconds, retained `full-unit.json`. The full Electron suite, current package, clean Windows 10, installer and hardware acceptance were not rerun for these changes.
