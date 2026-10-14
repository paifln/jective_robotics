# Current Electron environment worker profile

Read-only full retained SDK scan under Electron 44.7.0 / Node 24.21.0 with current slot-refill scanner, original-fs and 128MiB worker old-generation limit. Process/session completed exit 0 (session 84080, Electron PID4504); no restart or compiler/upload invocation. Detailed sdk-tree-electron.json retained.

Hash matched historical complete environment exactly: scope v2, SHA256 `05d780d8394605ad310a76c978d1015bd0b80fcc80305f8c4d3852b23cfb5533`, 59748 files, 6852176031 bytes. Worker 129597.63ms; parent 129660.90ms; maximum eight concurrent streams. Metadata 132815 calls with 12 over100ms; directory reads 13294 calls; stream timing totals overlap, so cannot be added as wall-clock components.

Earlier profile was about114.94s against a different physical SDK copy and uncontrolled filesystem cache/load. This run does not demonstrate speedup or regression causally. It demonstrates current full hashing correctness but leaves the declared performance baseline and actual current-package compiler journey unverified. Approximately130s per hash scan explains why a helper observation limit must be distinguished from the independent CLI/scan limits; it does not erase the prior failed corrected-build observation.

Uses diagnostic Electron main/worker bootstrap with instrumented I/O rather than an actual production EXE compile. User preview and user data unchanged.
