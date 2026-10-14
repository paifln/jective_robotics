# Student world files — source only

Simulator Open practice area and Save practice area actions remove the need to paste JSON into technical controls. The native browser file selection reads at most 1 MB, checks the whole document and stops the current simulation only after successful validation. Cancelled selection does nothing. Invalid or oversized documents preserve the active area. A map selected while a file is still being read takes precedence over that read.

Saving exports the active world rather than the designer's independent draft. Supported robot settings, geometry, line, button inputs and scheduled events are retained. Documents declare metres, radians, milliseconds and screen coordinates. Existing raw world JSON remains supported. Content is validated independently of file name or MIME type; importing never executes code.

Verification: 375 unit/integration tests across 122 files; 96.31% branch coverage with unchanged per-file threshold; typecheck, lint and build pass. Three final Electron scenarios cover Studio, designer and actual file round-trip, malformed/oversized files and a delayed read superseded by map selection. [Recorded evidence](../evidence/world-files/verification.json).

Not yet packaged. Published 0.8.9 remains immutable. Project-owned world persistence, L43 curriculum registration/adaptive tasks and the remainder of the 60-lesson course remain outstanding. Physical upload, Windows 10, clean installer lifecycle and live OpenAI were not tested.
