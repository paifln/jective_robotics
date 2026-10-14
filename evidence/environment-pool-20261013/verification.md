# Refill SDK hashing slots

The prior scanner waited for all eight streams in a batch. A new deterministic held-stream test reproduced the stall (before-unit.json). Scanner now uses a set of outstanding tasks, releases completed tasks and waits for any slot to finish before scheduling the next file. Limit remains eight; all content, size, mutation, symlink, traversal-depth and cancellation checks retained. Digest entries keep their deterministic traversal indices and scope stays v2, preserving digest compatibility.

Nine focused scanner/worker tests PASS. Full 551-test suite and unchanged 80-percent per-file coverage gate PASS; aggregate branches 96.29 percent. Typecheck/lint PASS. The held-stream test confirms more than eight total files progress while one remains held, peak concurrency at most eight, identical digest and all streams closed.

Full retained SDK comparison PASS: 59748 files, 6852176031 bytes, identical hash 05d780d8394605ad310a76c978d1015bd0b80fcc80305f8c4d3852b23cfb5533. One sequential standalone Node measurement baseline 24907 ms then slot-refill 21307 ms. OS cache/order and background workload are uncontrolled; this is not a statistically established speedup or Electron build-performance proof. benchmark.json retains results and scope.

No fresh EXE/actual compiler run yet with the new scanner. The previous packaged timeout remains FAIL and is not relabeled. Current-source-editor-stacking-20261013 contains the prior scanner. Next measure the actual application worker and verify an updated protected EXE before any end-to-end compilation claim.
