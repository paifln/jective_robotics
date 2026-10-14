# Studio refinement — post-release source

Implemented a single compact Studio toolbar, a larger editor surface, one primary **Run on board** action, a branded upload dialog and a seven-day activity preview in the top-right calendar. The simulator identifies the current project and directs edited C++ back to the physical-board workflow in EN/RU/KK. Four additional fields bring the catalog to sixteen; no preset replaces the learner's current program. The manual now states the matching field count. Navigation still collapses to icons and retains its preference. Student chat exposes no provider/model/key controls; OpenAI configuration remains separate in Help.

Verification on the development source in Windows 11:

- TypeScript, ESLint and build passed.
- Full Vitest coverage run: **498 tests, 171 files, 96.39% branches**, including all sixteen deterministic simulator traces and geometric reachability of the four new fields. One initial failure expected the former twelve-field count; it was corrected to sixteen. The failing receipt is retained alongside the successful result.
- Four normal Electron UI scenarios passed: all 58 existing lesson introductions and animations, themes, actual Arduino CLI valid/invalid compilation, stale-build upload invalidation, Russian/Kazakh Studio controls and compact Studio workflow. Final two scenarios additionally verify unchanged starters/copies earn no activity, native changed saves do, cancelled saves do not, green preview cells, all new fields, localized C++ simulator error, 800px layout and absence of preset/provider controls.
- GUI file dialogs and USB device listings are substituted where explicitly marked by their tests. Native save IO, SQLite learning/activity persistence and Arduino compilation are genuine. No upload to a fixture port is performed.
- Screenshots of both themes, 800px layout and board-run dialog are retained here. Machine results: `.verification/studio-refinement/`.

The preceding L59 documentation foundation is also typechecked and tested: original-instruction immutability at native writes, exact backup preservation, structural-only self-report grading and escaped/CSP-constrained standalone HTML. **L59 has no learner panel or catalog lesson yet; the course remains 58/60 drafts.** Its peer attempt is a learner report, never independently observed by software.

The published **0.8.18 installer is unchanged and does not include these post-release source improvements**. No new installer was packaged in this refinement. Physical ESP32/JECTIVE upload/runtime, Windows 10, clean installation/uninstallation, live OpenAI and the complete packaged learner workflow remain **NOT RUN**. No claim of perfect usability or completed master acceptance is made.
