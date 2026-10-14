# L10: Loops and termination

Source adds the tenth substantive lesson with complete draft English, Kazakh and Russian sections, three explained questions and a starter/reference pair. The auditor counts 799 English learner words. It compares counted repetition, bounded condition loops and an intentionally continuing event loop, and includes a stop request and an execution budget.

Tests cover target zero, three, four, exact budget five, early stop, target six, the starter's missing counter update and a no-wait runaway event loop. Both simulators distinguish normal completion from `LOOP_BUDGET` and global instruction-budget failure. A real Electron test loads the reference blocks and observes DONE at 600 ms followed by IDLE at 700 ms.

`node scripts/lesson-compiler-check.mjs L10` compiles the actual starter and reference with the pinned ESP32 toolchain. The script can verify other selected lesson programs; without arguments it examines all registered program artifacts and explicitly records hardware-unsupported simulation-only programs. This targeted run does not prove the whole curriculum compiler gate. Physical upload remains NOT RUN.

The overall content gate remains NOT COMPLETE: 50 lessons and technical language review remain. These source changes follow the published 0.3.0 artifacts, which still contain six lessons. Earlier condition-loop notes saying L10 was unprovided are superseded by this record.
