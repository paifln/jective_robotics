# Content fingerprint conflict protection

Project opening reads validated content and SHA-256 of exact file bytes in one snapshot. Main retains this fingerprint with the path/revision and clears it when switching/resetting/restoring the document. Successful saves retain the fingerprint of the exact committed serialization. Save verifies revision/id and the expected fingerprint before staging and again immediately before atomic rename. Legacy persistence callers retain revision-only compatibility; the desktop bound-file path supplies the fingerprint.

Full 550-test regression and unchanged per-file 80 percent coverage gate PASS; aggregate branches 96.32 percent. New boundary test proves same-revision source changes and formatting-only changes reject with PROJECT_CONFLICT and unchanged external bytes. Explicit reopen updates the fingerprint and allows a reconciled save. Two source Electron tests PASS: restart/Unicode/CRLF/revision journey with same-revision external modification; exclusive SQLite backup restoration and old-file preservation. Typecheck/lint/build PASS.

This is optimistic conflict detection, not a filesystem transaction against arbitrary external writers: a writer racing between the final comparison and rename remains a limitation. No forced-crash, power-loss, physical hardware or installed-app acceptance claim.
