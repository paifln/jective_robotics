# Localized workspace recovery messages

Shared operation error formatter now supplies EN/RU/KK next steps for WORKSPACE_BUSY, PROJECT_BUSY, TOOLCHAIN_BUSY, SAVE_CANCELLED and BACKUP_TOO_LARGE. The project action hook and project browser refresh path use it, as does the existing main application result path. Known codes preserve a diagnostic code and omit raw private diagnostic paths. Unknown diagnostics retain their previous behavior.

Four formatter tests PASS (including all fifteen code/locale combinations), typecheck, lint and build PASS. Two source Electron regressions PASS: persistent reading/project browser and real SQLite backup/restore. No new production package was made for this text-only change; current-source-restore-lock-20261013 remains the previous immutable packaged snapshot and does not contain these new messages.

A later packaging turn verified these messages in current-source-workspace-messages-20261013. See ../package-snapshots/current-source-workspace-messages-20261013/verification.md for the immutable EXE verification scope.
