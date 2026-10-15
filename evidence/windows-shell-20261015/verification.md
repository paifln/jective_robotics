# Windows shell, floating helper and engagement

Historical stage journal. The dated paragraphs below retain their original verification scope; current outcomes are in [the r5 report](../package-snapshots/current-source-windows-shell-r5-20261015/verification.md) and [verification index](../../docs/VERIFICATION.md).

Source stage on the current Windows11 development host. The owner asks for work until00:00 on16October2026 Asia/Qyzylorda (15October19:00UTC), while physical hardware is being developed. The owner confirms there is no reference design photo: choose a colourful Windows desktop editor style. Work remains active; this is an intermediate record, not release acceptance.

## Implemented

- Frameless Electron window, custom draggable caption and localized minimize/maximize/restore/close buttons. Typed narrow IPC validates only three supported actions and targets the owned window. Main uses `close()`, retaining the existing unsaved-work confirmation. Renderer remains sandboxed; native operations stay outside the browser graph.
- Compact command bar, Segoe UI, stable application scrolling and colour-coded navigation icons. Studio component status is more compact without removing assigned ports or verification warnings.
- Assistant is a fixed nonmodal popover launched from a small floating icon. It preserves conversation/draft while minimized and navigates independently of the underlying workspace. Its upper bound follows Studio commands so save/run are not covered. Code review, source-sharing consent, exact request inspection and stale-source guards remain.
- Bounded session-only notification history (30 entries), read/clear/dismiss controls, transient toasts and localized semantic messages emitted only after actual save/build results. Opening the app does not award learning progress or activity.
- Launch motivation in three languages on the blue logo splash. The earlier daily greeting was removed after owner correction.56 distinct entries:6 sourced excerpts and50 JECTIVE original phrases; no AI calls or login reward. Details: docs/LAUNCH_MOTIVATION.md.

## Verified so far

- Full domain coverage run:563 tests/189 files PASS,96.25% branches (3496/3632), unchanged80% per-file branch threshold. Packages only; does not measure all React/main/native code.
- TypeScript PASS; ESLint PASS before the latest layout-only refinement; build PASS including architecture guard and136 EN/RU audio hashes.
- New desktop-shell E2E: real native maximize/restore/minimize, native state events, localized controls, five workspace sections, retained assistant draft, Escape/focus return and window/popup bounds at1000/800/480px PASS.
- Engagement E2E updated after owner correction: no greeting card in lessons; activity remains empty on entry; actual native-file save produces a notification; toast dismissal retains history; read/clear and live RU translation work. Actual `will-prevent-unload` confirmation is observed through a native dialog fixture, cancellation keeps edited Monaco source and window alive. PASS.
- Existing reading and Studio density journeys PASS against the new shell, including offline audio/reading controls, dated projects and code area requirement at800px.
- Managed chat and long-response journeys PASS using a local HTTP gateway fixture, no live OpenAI. Existing file-review consent/stale-source/no-device-command checks PASS after command clearance improvement. Compact flex layout, file-review consent and managed-chat provisioning checks PASS against local fixtures; no live provider.

## Preserved failures and corrections

- First engagement run blocked on Playwright/Electron competing over beforeunload. Failed runs retained under `test-results`; only identified owned verification Electron processes were stopped. Test now observes Electron's native decision without CDP automatically dismissing it; cancellation is explicitly asserted. Production unload protection was not removed.
- Notification Escape after clearing a focused button initially left the flyout over commands. A document Escape handler now closes it even if disabling Clear moved focus. Corrected E2E PASS.
- Initial floating assistant had12px horizontal overflow from the offline-reference width plus margin. Corrected width; computed panel/client width408/408 with no overflowing children.
- Initial main height inherited `auto`, allowing document height2279px. Main now owns a bounded viewport scroll area; long replies remain in the transcript and composer stays reachable. Corrected long-reply E2E PASS.
- File-review test initially found Save blocked by the popover. Popover observes command-bar bounds and adapts height; corrected full review E2E PASS.

Screenshots and traces are local generated evidence under `test-results/desktop-shell`, `test-results/engagement-*` and `test-results/floating-chat-*`; not all are published in Git. No installer was regenerated, no remote deployment, paid AI request, physical hardware or Windows10 verification performed. Previous package hashes/results belong only to their own artifacts.

## Further scoped checks, 15 October

580 domain tests/192 files PASS,96.34% branches3529/3663 (per-file80% threshold unchanged). TypeScript and full ESLint PASS after correction of a test-only helper import. Dependency audit:0 known vulnerabilities on15October. Architecture2 tests and bundled-boundary check PASS; server14 tests PASS, all local upstream fixtures. Content structural scan finds60/60 authored lessons but reports NOT COMPLETE because human translation/technical review remains required. Audio136 EN/RU files match text/file hashes; Kazakh and human listening review remain unavailable.

Actual native Electron launch test observes a quote with the logo and a different ID after reload, no lesson greeting and no activity reward. A first test run stalled on competing beforeunload handling; corrected fixture listener/native decision PASS. Quote screenshot visually inspected. Studio rail/device-last-item, save/activity/upload-disabled/fullscreen/editor-expansion checks PASS after migration from removed assistant rail item and old project labels. Code-space test uses actual native viewport height (Electron page.viewportSize can be null), while independent density test checks five viewport sizes and three locales. World import/export test uses the real file picker input, not a restored JSON editor; PASS.

Component status dock is now presentation-only: hidden duplicate serial controls and their automatic port scan removed. Actual upload/monitor controls remain. Rejected/malformed bridge replies in StudentBoard/BoardMonitor show localized generic recovery text rather than raw exception payload; stale port selection clears. Dedicated malformed-response/throw/retry fixture E2E PASS; no real port was opened. The independent frozen152-case full UI baseline is still running and has failures, including obsolete navigation/palette/selectors and CORE_MISSING because Arduino CLI cannot follow its SDK junction. Its failure evidence will be retained separately. These scoped passes do not imply full UI acceptance.
