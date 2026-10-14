# Offline lesson audio module

useLessonAudio owns catalog loading, request abortion, media state, speed and window visibility cleanup. ReadingTools renders localized controls and handles popover focus separately. Epoch checks suppress a rejected play promise from a departed lesson. No synthesis, remote media or provider requests are introduced.

Typecheck, lint and build PASS. Three source Electron tests PASS: actual offline audio decoding, persistent reading preferences/project workflow, native 200 percent zoom and keyboard control, and visible-lesson animation behavior. Additional source regression PASS: a deliberately delayed rejected play promise from L03 is released after selecting L04; L04 shows no stale error. The rejected-play case is an explicit media fixture, not a real audio failure claim.

A production snapshot including these changes passed its scoped checks; see ../package-snapshots/current-source-reading-access-20261013/verification.md.
