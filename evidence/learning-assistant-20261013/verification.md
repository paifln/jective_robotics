# Current learning and reviewed-hint workflow — 2026-10-13

Reconciled `content-assistant.spec.ts` with current Programming, Start the task in Studio, My projects/versions and Ask for help navigation. The obsolete test targeted removed provider controls, assumed an English/default Studio start and used old snapshot labels. It was replaced with current interactions while retaining actual persistence, credential handling, provider HTTP transport, consent and original-program preservation assertions.

Focused test passed (1 test/6.8 seconds, `e2e.json`): actual L01 starter/generated source and SQLite autosave; named version saved through production service; real configure IPC stores a dummy key using Windows safeStorage; learner request reaches a loopback HTTP fixture through the unchanged main ask handler; transport receives model/dummy authorization, and unshared source is absent; response is shown and reviewed before apply; applied Code copy has proposed source, while original Blocks source/workspace are preserved. No observed renderer pageerror.

**Explicit fixture boundary:** the learner UI intentionally only accepts OpenAI readiness. This test overrides only `assistant:settings` readiness metadata to enable the UI while the actual service configuration points to a labeled loopback HTTP fixture. Configure, ask, transport, protected storage and persistence are production implementations. This is not a live OpenAI model test, a real educational local-model endpoint test, or evidence that the shipping UI supports arbitrary provider endpoints. No actual secret, paid request or physical device command was used.

Typecheck and lint passed after the test update. Product source/build were unchanged in this verification turn.

## Broader current-source GUI checks

Seven additional tests passed in 41.0 seconds (`learning-design-e2e.json`): L37 generated-line/adaptive-answer/Code-copy behavior; L59 documentation learning and draft restart; L60 evidence-boundary draft restart; L56 faulty/corrected integrated simulation and trace downloads; prerecorded audio/readability/full-width theory/dated project search; Studio density at multiple sizes and three locales; Russian/Kazakh Studio and explicitly fake USB-discovery metadata with upload disabled. They do not establish all lessons, worlds, manual accessibility, real serial discovery/upload or packaged acceptance.

Inspected actual 800×700 light/dark Studio screenshots retained here: commands and code tabs remain visible, code viewport is usable, and dark panels match the theme. Metrics are retained in `studio-metrics.json`. Current screenshots of the project list and theory were produced by reading-design tests in `evidence/reading-design`; their fixtures are labeled. These are viewport checks, not Windows DPI tests at 100/125/150 percent or human screen-reader review. The complete 130-file Electron suite remains unverified.

User preview PID 8928 was observed responding and left open. It is the prior production snapshot, not a new build or installer. Clean Windows 10, NSIS lifecycle, live provider credentials and physical hardware verification remain NOT RUN.
