# Actual packaged compiler and restart journey — 2026-10-13

Executed the unchanged current-source-ui-recovery-20261013 production EXE from an ordinary directory with spaces and Cyrillic. Physically copied the approved SDK data/user into separate ordinary spaces/Cyrillic directories; no links or user workspace were used. Actual production renderer accessed through temporary loopback Chrome diagnostics; no main inspector, fuse change or IPC handler override. Isolated fixture retained at `.verification/ui-recovery-journey-20261013-3d7530c7`.

`result.json` has phase PASS, start recorded as `checkedAt` 14:45:21.781 UTC and actual final cleanup timestamp `finishedAt` 14:54:27.472 UTC. Setup copying is included in this overall duration. Individual durations below include compiler integrity checks and journal inspection; they are development-host measurements, not the required baseline performance test.

| Code | Operation | Compiler exit | Duration | Raw log | Artifacts |
| --- | --- | --- | --- | --- | --- |
| Missing symbol | f95fbdc5-f4e5-4271-acb6-40de49d8faf1 | 1 | 156696 ms | 751 bytes | none |
| Corrected sketch | e6160102-7ee2-4a55-aae0-fd5d68f3736a | 0 | 259475 ms | 207 bytes | six BIN/ELF files |

Failure contained the actual `missing_symbol_for_packaged_test` diagnostic. Corrected sketch produced expected sketch.ino.bin/sketch.ino.elf plus boot/partition/merged binaries. Every artifact byte hash matched its native manifest. Approved SDK content digest was `05d780d8394605ad310a76c978d1015bd0b80fcc80305f8c4d3852b23cfb5533`; successful service checks confirmed it remained unchanged through compilation. Full raw journal text read through actual packaged UI/paged IPC equaled original raw files for both operations; preserved failed/succeeded manifests retain details.

Committed corrected source recovered through normal application launch after termination/restart of the owned test instance. Subsequent read-only SQLite inspection (`project-preservation.json`) confirmed distinct original Blocks and Code-copy IDs, equal original block workspace and original named snapshot; Code copy retained the exact corrected sketch. These are committed-state checks, not forced termination during an in-flight autosave or a migration-failure experiment.

EXE/ASAR stayed identical to the source snapshot throughout copy/run; renderer node `require` remained absent. No renderer HTTP request was observed, but this was not an OS-disconnected test and other-process network traffic was not instrumented. No port, uploader or physical hardware was accessed. Native log export dialog and packaged stale-upload rejection with a selected device remain unverified. Clean Windows 10, NSIS lifecycle, complete curriculum/compiler matrix and physical runtime/safety gates remain incomplete.

Only captured owned test processes were terminated. User preview PID 8928 was independently observed responding after this test and left on its previous package.
