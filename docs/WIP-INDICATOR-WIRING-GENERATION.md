# Indicator wiring used by generation

Explicit logical led assignment now controls indicator GPIO generation. An absent assignment uses the profile's existing reference default; an explicitly unassigned led returns no pin and blocks generation when indicator instructions need one. Reserved, unknown, input-only, provisional and conflicting allocations are rejected. Wiring changes regenerate source in Blocks mode and invalidate the previous build. Lesson projects inherit the selected wiring along with their profile binding. Independent Code mode remains manually authored and is not rewritten.

The toolchain independently validates Blocks-mode indicator allocation before compile or upload. Two tests exercise generated GPIO changes and invalid mappings without invoking any CLI. All 117 unit/integration tests passed with aggregate branch coverage 866/948 (91.35 percent), with the unchanged per-file gate. Type checking and lint passed after correcting a test tuple type.

Two source Electron scenarios for indicator allocation/unassignment and existing Studio behavior passed in 6.6 seconds. The indicator scenario was then rerun with JECTIVE_REAL_COMPILER=1: GPIO4 source successfully compiled through the actual pinned Arduino CLI/ESP32 toolchain (38.7 seconds total). No upload or physical GPIO observation occurred. Reports are retained in evidence/wip-indicator-wiring, with actual-compiler-e2e.json separate from the noncompiler run.

This is indicator mapping, not completed motor/sensor adapters or physical wiring validation. Published 0.4.0 artifacts remain unchanged; full master acceptance remains incomplete.
