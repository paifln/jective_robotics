# Reading and desktop design verification

Implemented full-width lesson text, shared persistent text size (16/18/20/24), spacing and reduced-motion settings, interactive pixel/soft SVG concepts, real motor and servo photographs with attribution, keyboard-close photo enlargement with Jective branding, and searchable project rows ordered by last save.

Offline narration: 136 Ogg Opus recordings, 69,465,344 bytes; all 8 foundation lessons and 60 course lessons in English and Russian. Prepared with installed Windows Irina/Zira voices, without AI service calls. Kazakh recordings unavailable. Source-text and file SHA256 checks run during builds. All 136 recordings decoded through the actual restricted Electron protocol; one muted playback and 1.25x playback rate verified. Human audible pronunciation review NOT RUN.

Media is served after existing realpath containment through a bounded single-range reader (10 MiB limit). Exact/open/suffix/invalid ranges tested. No CSP bypass added. UI/media/narration/preferences are separate modules.

Verification: full unit coverage run passed 508 tests / 175 files; branches 96.42%. Typecheck, lint and build passed. Reading/design native GUI scenario passed after final CSS change; audio metadata and existing Studio regression passed in the preceding run. Responsive widths 480/800, both themes, persistent settings, native save dates/search, image zoom/Escape and disabled animation checked. Screenshots visually inspected. Earlier failures retained under .verification/reading-design; duplicate sibling React keys fixed (mixed translations/duplicate illustrations), lazy-image fixture scroll and project filtering corrected.

Photos: motor https://commons.wikimedia.org/wiki/File:Electronic-Component-Screw-DC-Motor.jpg (Evan-Amos, public domain); servo https://commons.wikimedia.org/wiki/File:Servo.jpg (Sonett72/Aiyizo, public domain). Download/hash receipts in .verification/reading-design/photos.json. Raw generated WAV preserved outside distribution under .verification/reading-design/raw-audio.

Source/dist changes only: published 0.8.18 installer unchanged and excludes these changes. User-owned app preserved; no physical ESP32/JECTIVE, Windows 10, clean installer lifecycle, live OpenAI or full packaged learner flow verification. Human translation review and broader master acceptance remain pending.


Follow-up project search: explicit localized no-results feedback and Clear search button, announced result count, trimmed queries. Native GUI verified negative query, clear restores both actual saved projects, whitespace query finds the intended project. Typecheck/lint/build pass; final reading GUI pass. Receipt .verification/reading-design/project-search-feedback-ui.json.


Project refresh robustness: independent settled workspace/snapshot requests, generation guard discarding obsolete replies after project change/unmount, reset versions on project change, caught transport rejections with localized retry guidance. Preserve already-loaded list on a refresh failure; Refresh disabled while pending. Actual isolated Electron IPC transport exception tested: message displayed, saved filtered row remains, Refresh re-enabled, handler repaired with captured actual workspace response and retry clears error. No shipping fake data/handler. Typecheck/lint/build passed, reading native GUI passed. Race guard implemented but delayed out-of-order GUI scenario not yet tested.


Obsolete reply GUI check: held first snapshot IPC response in an isolated fixture; refreshed while held, confirmed disabled Refresh, accepted existing dirty-project confirmation and opened an actual saved project (old pane unmounted). New pane received current-version fixture, then released obsolete reply. Current versions remained after 300ms and no obsolete label rendered. This tests switching/unmount stale response behavior, not every in-place concurrent refresh race. Final native reading/design scenario passed; typecheck/lint passed. Receipt .verification/reading-design/project-obsolete-response-ui.json. Test handlers are fixture-only.


Audio catalog hardening: strict EN/RU/KK-only index, exact sorted equality with recording entries, duplicate/extra/missing ID rejection, required locale-specific Windows voice metadata. Pure validator separated from file/hash checker. Dedicated audio:test Node test passes valid catalog and six malformed index/voice cases; command included in release:verify. Actual136 recording asset/text/hash check passes; lint passes. Metadata checks do not certify actual spoken language/pronunciation; human listening review still NOT RUN. No new narration generated and no installer rebuilt.


Architecture follow-up: project catalog/version read lifecycle extracted into useProjectBrowser hook; UI retains presentation/search and explicit user mutations. Independent settled requests, localization, pending state and stale generation guard preserved. Typecheck/lint/build and full reading GUI (real saves, transport failure/retry and obsolete response after project switch) passed after extraction. Receipt .verification/reading-design/project-browser-hook-ui.json. No physical or installer verification added.


Navigation/readme follow-up: arrow/Home/End sidebar focus, aria-current, focus outline and short opacity/button transitions respecting OS and reading reduced-motion. Monaco creation delayed to first Studio entry and retained thereafter. Initial absence of Monaco verified; keyboard navigation, real Code copy save, reading/projects and Studio three GUI scenarios pass. Typecheck/lint/build pass. README rewritten with setup/checks/toolchain/architecture/status/license and tested local links, previous text archived docs/README-HISTORY.md. Multi-file editor undo/save assertions passed but real invalid-compile wait timed out at90sec while log still Running actual Arduino CLI; compiler diagnostics outcome remains unresolved (failure preserved editor-deferral-regressions.json). No timeout relaxed or assertion removed.
