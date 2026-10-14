# L11 actual compilation and host execution

`npm run functions:check` bundles the actual lesson artifact and current generator, compiles both generated starter and reference using Zig, executes both binaries with explicit Arduino host stubs, and compiles both sources using the genuine Arduino CLI / ESP32 toolchain. Both host compile and execution exit codes are zero; both Arduino builds succeeded. Lint passes for the new verification script.

Assertions verify the two actual lesson calls finish at 300 ms with BETWEEN and DONE messages, that the starter remains ON and the reference finishes OFF, and that reference arguments 0, 1, 100 and 60000 produce their exact elapsed times. Arguments -1, 0.5 and 60001 generate WAIT_RANGE and latch execution failure; subsequent setup cannot emit a false success message. These are executed C++ assertions, not text matches against generated code.

The report at `evidence/wip-L11/compiler.json` includes generated sources, host commands' results and actual Arduino build metadata. This resolves the pending L11 compile checks in WIP-L11.md. Physical upload/execution, clean Windows 10 acceptance, full regression E2E, localized function blocks and updated installer packaging remain outstanding. The existing release artifacts are unchanged. The master prompt remains incomplete: 11/60 lessons are authored and translations require review.
