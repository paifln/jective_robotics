# Journal-page contract invariants

Source contract now enforces offset <= nextOffset <= totalBytes, a maximum64KiB page span, exact EOF-flag agreement, and forward progress for nonfinal pages. This prevents stalled/inconsistent validated IPC responses from entering journal navigation. Empty final pages remain valid.

- Targeted16tests/2files passed, including real long UTF8 journal reading/export and negative response invariants.
- Full525tests/178files passed, package branch coverage96.32% and configured per-file thresholds passed.
- Build/typecheck/lint passed.
- Electron journal UI scenario passed4.9s: actual sandboxed preload rejected stalled, backward, oversized and false-EOF fixture responses; existing keyboard/navigation/localization/export/800px-layout checks retained. IPC responses for these negative cases are explicit fixtures, not compiler execution.
- No actual compiler cycle, new package, installer, Windows10 or physical hardware verification repeated for this contract-only change. Earlier source compiler evidence remains separately scoped in evidence/journal-ui.

Continuous output streaming, restarted-session and integrity-failure journal access remain unfinished. No full product acceptance claim.
