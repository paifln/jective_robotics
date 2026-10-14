# Compiler output separation - 2026-10-12

Source process output now retains stdout and stderr separately, bounded to 1,000,000 UTF-16 units per stream and combined log with surrogate-safe tails. Existing independent UTF-8 decoders and EOF flushing retained. Structured core JSON and version checks use stdout exclusively.

- 21 targeted tests across 3 files passed.
- 517 full domain tests across 177 files passed; package branch coverage 96.43% and configured per-file thresholds passed.
- Typecheck, lint and build passed.
- Actual installed Arduino CLI version/core-list queries passed (1.5.1 / ESP32 3.3.12); results include separate streams.
- No actual compilation, upload, physical hardware, Windows 10, installer or updated packaged snapshot verification performed for this change.

Existing package snapshots and installer were not modified and predate this change. Full raw-log persistence/export and continuous streaming remain incomplete.
