# Two-input dashboard foundation, after 0.7.0

Historical foundation snapshot: full L18 and numeric serial messages have since been implemented in the working tree. See [current scope and verification](WIP-NUMERIC-MESSAGES.md). The foundation evidence below remains unchanged and describes its earlier test run.

This is an unpackaged working-tree change. The immutable 0.7.0 installer/source archive and their installed verification do not contain it. L18 is not yet counted as an authored lesson: its full trilingual instruction, assessment and numeric serial-message activity remain to be implemented.

The executable starter/reference artifact collects ten samples at 200 ms intervals. The analog model changes from 1 V to 2 V at 1000 ms; distance becomes unavailable at 400 ms and returns at 1000 ms. The reference records a validity flag before reading distance. The unguarded starter stops with DISTANCE_READING_INVALID at the disconnection.

A program commit marker distinguishes a completed sample from partially assigned variables when an instruction fails. The series builder ignores uncommitted rows, rejects incompatible ranges, invalid clocks and conflicting duplicates, and emits null distance for an invalid sample even if a retained variable still contains an earlier value. Valid zero remains zero. CSV labels simulation origin, time_ms, analog_V, distance_m and distance_status. The status is deliberately generic invalid: the flag alone cannot establish whether a fault was missing input or an out-of-range rejection.

The simulator renders separate voltage and distance SVG plots with independent scales and units. Invalid distances break the path and display fault marks, while the analog channel continues. The CSV export contains actual committed program variables, not invented readings reconstructed from the scenario. Existing L14 analog plotting remains available for other programs.

Domain tests cover exact sample timestamps, three disconnected samples, recovery, incomplete starter-row suppression, true zero, retained invalid values, range/clock validation, duplicate conflicts and CSV cells. The native Electron scenario opens a real project, runs the real worker, inspects both plots and reads the actual downloaded CSV. Compatibility scenarios cover the existing analog plot, L17 and the learning interface. Current proof is under evidence/dashboard. It is a targeted source-build run; no new installed/full-suite/hardware verification is claimed.

Next: implement a bounded labeled numeric print instruction across Blockly serialization, both simulation engines, function frames and C++ generation. Current print instructions emit fixed strings, so the artifact's numeric data currently exists in variable history/CSV rather than dynamic serial messages. Then author and register complete L18 EN/RU/KK content and checked practice, and verify the starter/reference through the lesson-loading UI. The full curriculum still has 17 authored lessons out of 60.
