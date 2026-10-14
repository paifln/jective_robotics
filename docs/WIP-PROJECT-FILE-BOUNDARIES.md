# Project file size and replacement boundaries

Source now checks serialized UTF-8 size before opening a temporary output. Previously the writer could commit a project exceeding the reader's two-million-byte limit. Such a file would save successfully and then fail to reopen. Oversized writes now report `PROJECT_TOO_LARGE` and preserve the previously committed file.

New filesystem tests cover successful matching-revision updates, rejection of a different project ID with the same revision, oversized reads/writes, preservation of committed bytes, and temporary-file cleanup when the destination is a directory. They operate only in explicitly created temporary directories. The Electron persistence test sends an oversized fixture through the actual bridge, observes the error and reopens the preserved Unicode project.

All 73 unit/integration tests passed; type checking, lint and the targeted Electron scenario passed. Project-file branch coverage is 11/12 (91.66 percent); total domain branch coverage is 651/795 (81.88 percent). Four other modules still fail the per-file 80 percent gate. This does not establish cross-process compare-and-swap guarantees or disk/power-loss behavior; further fault tests remain.

The source fix is after published 0.4.0 and is not included in that installer or ZIP. Full master-specification acceptance remains incomplete.
