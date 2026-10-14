# Student experience — source work, 2026-10-11

This document records the original source redesign and its 307-test checkpoint. The redesign and subsequent photograph/security work are now included in the 0.8.2 development preview; see [the current release scope and verification](RELEASE-0.8.2.md).

The newer user request takes precedence over the master document's local-class workflow. This application supports independent student learning. The classroom screen and its renderer have been removed; existing stored classroom records remain readable by the legacy backend. The user identified the board family as ESP32, but did not supply a reviewed JECTIVE carrier pinout.

## Learning and navigation

The primary order is Lessons, My projects, Studio, Simulator and My board; Help sits at the bottom. Russian is the default for a new workspace. Existing explicit language choices remain intact. All 36 authored lessons have tailored short explanations and actionable tasks in EN/RU/KK, followed by practice with answer checking. Twelve illustration types include interactive values and play/pause animations. Original longer theory and worked examples remain available in expandable sections.

Lesson selection and unsubmitted quiz answers survive navigation to Studio and back. Hidden lesson animations pause. Help drafts and reviewed source proposals also survive navigation. Advanced controls are collapsed, while the code editor has a larger usable area. Compile, run and upload commands use icons with accessible names and hover/focus labels.

## Architecture and behavior

- `StudentUI.tsx` centralizes student navigation and action icons; `StudentProjects.tsx` presents existing transactional project APIs.
- `student-theory.ts`, `student-tasks.ts` and `simulation-labs.ts` separate learning copy and executable examples from the renderer.
- `LessonStory.tsx`, `LessonInstructions.tsx` and `LessonLab.tsx` separate illustration, explanation and specialized experiment dispatch.
- `StudentBoard.tsx`, `ConnectionsPanel.tsx` and `hardware-copy.ts` explain USB, logical pin assignment, real compilation and guarded upload. A logical assignment does not detect a plugged-in motor or sensor. The default indicator assignment matches generated GPIO2 unless explicitly changed or unassigned.
- `StudentHelp.tsx` provides offline answers with an optional online assistant. Applying a reviewed C++ proposal from a block project creates a separate Code copy and preserves the original. Persistent Monaco diff models avoid the disposed context-service error during navigation/application.
- Enlarged editor styles target `.studio-editor`, so they cannot cover buttons with Monaco's internal `.editor` elements. Theme-aware SVG surfaces support light and dark modes.

Simulator examples run the actual simulation worker: driving, turning, obstacle stopping and indicator blinking. An example does not replace the student's project until explicitly opened in Studio. Six existing worlds have friendly translated names and readable instructions. Unknown distance readings remain unknown and trigger a safe stop in the obstacle example.

## Verification scope

Type checking, lint, source build and 307 unit/integration tests pass. Aggregate package branch coverage is 2483/2585 (96.05%); the existing per-file branch gate remains enabled. All three targeted source Electron scenarios pass with no skips or flakes: student navigation/learning/simulation/reviewed Code copies, real ESP32 compilation, and independent Blocks-to-Code copies. Results and screenshots are under `evidence/student-experience`.

The compilation scenario uses the real pinned Arduino CLI and ESP32 core, checks a valid build, invalidation after editing, and an intentionally invalid C++ program. A mock enumerated COM port is used solely to check the UI upload gate. No firmware is uploaded and no physical motor or sensor is exercised. The reviewed-assistant scenario supplies a proposal locally; it does not call an AI provider. Historical full installed-app scenarios are not a claim of full regression coverage for this new UI.

These changes are unpackaged source work. Published 0.8.1 installer/source archives remain unchanged and contain their historical 23-lesson scope. Source contains 36 of the requested 60 lessons. Independent language review, the remaining lessons, additional physical adapters, a verified carrier pinout, physical board tests and clean Windows deployment acceptance remain outstanding.
