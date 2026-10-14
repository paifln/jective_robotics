# Full UI baseline: incomplete observation

The runner log ends at test 109/145 (`responsible-ai-lesson.spec.ts`). No JSON completion report exists at the time of this inspection. The previous exec session 35044 is no longer available; runner PID 8816 and the recorded worker PID 22476 are absent. The Windows process inventory shows no Electron verification process.

Therefore this run is recorded as **incomplete**, not PASS. The reason for termination is unknown; an observation timeout or process disappearance is not evidence of an assertion result. Earlier recorded failures remain in `.verification/current-full-ui.log`. No automatic restart was performed. Source snapshot: `source-hashes.json` in this directory.

Next verification must retain the original raw log, use distinct output paths, and separately report failed, skipped and not-run cases.
