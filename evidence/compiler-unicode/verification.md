# Compiler process Unicode verification

Two actual child-process regressions failed before the fix: independently split Cyrillic/Kazakh UTF-8 bytes became replacement characters, and a one-million-character log tail could begin with an isolated low surrogate. The failed unit report is retained. The large-string assertion was subsequently made concise without changing its expected outcome.

ToolchainService now maintains separate StringDecoder instances for stdout and stderr, flushes pending bytes at process close and prevents tail truncation from retaining half a supplementary character. The existing bounded-log, cancellation, timeout, spawn/configuration and build-invalidation behavior is preserved.

After the fix, 20 targeted tests and the full 515-test/177-file suite passed, with 96.42% package branch coverage. Typecheck, lint and build passed. Actual Node children exercised split UTF-8, Cyrillic diagnostic text, incomplete EOF and long tails. An external Electron 44.7.0 host also exercised split pipes and incomplete EOF with actual local Node children. These are process-layer checks, not actual Arduino CLI or physical-board verification.

The updated snapshot `.verification/current-source-unicode-20261012/win-unpacked` passed production packaged startup/workspace IPC, duplicate-instance, all-built-asset equality, binary-fuse and ASAR-tamper rejection/restoration checks. Its bundled worker and serial module were checked from an external matching Electron host. See the package snapshot receipts. The old snapshot and immutable published installer were not replaced.

Complete raw-log persistence/export and continuous compiler-output streaming remain unfinished requirements; the returned log is still a bounded tail. Full packaged compiler GUI, clean installer lifecycle, Windows 10 and physical upload remain unverified. The earlier intermittent SDK fingerprint failure is separate and unresolved.
