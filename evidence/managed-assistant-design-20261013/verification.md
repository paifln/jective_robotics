# Managed assistant and student reading changes — 2026-10-13

This is scoped implementation evidence, not full product acceptance.

## Implemented

- Standalone JECTIVE server gateway under `services/assistant`: fixed upstream OpenAI endpoint, server-only model selection, expiring individually issued learner credentials, request/response limits, cancellation/timeout, sanitized logs, and authenticated AES-256-GCM provider credential file. Master key must be stored separately by the administrator.
- Production launcher requires durable SQLite request quotas; atomic reservations survive restart and coordinate processes using the same local database. Per-process concurrency and reverse-proxy connection limits remain distinct controls.
- Desktop provisioning stores only a learner token with Electron safeStorage. Packaged renderer IPC rejects credential changes. Packaged student mode refuses legacy direct-provider configurations; administrator legacy credential cleanup is documented, not silently performed.
- Assistant opens immediately. Session-local dialogue and bounded recent context support follow-up questions. Code sharing remains explicit, source snapshots and reviewed application guards are preserved. The outgoing preview includes history; new conversation clears it.
- Student Help no longer contains provider/model/key controls. Managed gateway errors refer learners to connection/access recovery, not provider account settings.
- Generic repeated robot illustrations removed from foundations and programming lessons. Full theory/worked examples open by default. Existing subject-specific diagrams remain.
- Reading controls, local recorded audio and motion reduction are visible by default. Three additional real subject photos are bundled locally: breadboard, resistors and switches. Provenance is in `assets/licenses/learning-photos.txt` and the image captions. Initial original-host downloads failed with HTTP 429; official thumbnail downloads succeeded and the JPEG dimensions were inspected.
- Student scenario JSON editor removed; visual world designer and import/export remain. Softer layered synthesized interface cues and reduced-motion-aware panel/dialog transitions added.
- Additional scene controls preserve the selected lesson's robot, line and sensor models while editing start coordinates and obstacles or setting a timed button press/release. Invalid geometry/times are rejected. Three lesson instructions now refer to these controls instead of the removed JSON editor. The switch photo was corrected from the serial-message lesson L05 to the Boolean-logic lesson L09.

## Verification scope

Domain unit reports, gateway Node tests, and selected Electron UI reports are preserved here. UI includes genuine encrypted provisioning, two successive fixture chat questions with history, selected-file consent, pending snapshot stability, late-result rejection, local persistence, open lesson theory/audio controls, new image loading in both themes, localized narrow-screen navigation and absence of the student JSON editor.

Tests use explicit local fixtures. No real provider key, paid OpenAI request, deployed JECTIVE server, TLS certificate, physical board, Windows 10 machine or clean installer lifecycle was tested. Audio pronunciation and suitability were not independently human-reviewed; Kazakh prerecorded audio is unavailable. Subject-specific visual variety and the broader desktop redesign still need further work and learner review.

The older assistant review fixture initially failed because it still expected the removed collapsed chat container, then because its positional preview assertion mistook the new conversation preview for source. It was updated to the direct chat and an explicit `.shared-context` selector; the actual stale-source and consent assertions were retained. These initial failures are described here; final reports must not be represented as the entire GUI suite.

A new error-copy test initially matched the substring “ключ” inside the legitimate Russian word “подключение”. Its assertion was corrected to match the standalone key term. The initial failed full report is retained as `unit-final-guarded.json`; the corrected report is separate. Student error text was not changed to remove a valid connection instruction merely to satisfy that test.

Unpacked EXE snapshots have separate package evidence. Published NSIS installer remains unchanged and predates these changes. The complete project goal remains open.

Final observed results: 546/546 domain tests across 185 files; 4/4 gateway Node tests; typecheck, application lint and service lint/syntax checks passed. Seven selected GUI tests passed in `e2e-final-guarded.json`; the later two-test scene/reading run passed in `scene-reading-e2e.json`, preserving model metadata and validating both themes. These are selected runs, not the full GUI matrix. Fresh dependency audit reported zero known vulnerabilities, not universal security assurance. Structural requirements check passed with all 24 sections still PARTIAL and all 15 criteria NOT MET / PARTIAL; content validation still fails the independent human technical/language review gate.

Latest validated local binary: `current-source-managed-chat-r3-20261013`. Earlier r1/r2 snapshots are retained as evidence and are superseded. No published installer was replaced.
