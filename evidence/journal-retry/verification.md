# First-page journal recovery

An initial read failure now offers a localized retry button. A status announcement accompanies pending read/export requests. Successful retry clears the error and hides the retry action.

Build and Electron UI scenario passed5.2s. Explicit first-page failure followed by a valid response exercises actual sandboxed preload/UI; retry shows FIRST, removes the alert and retry button. Existing navigation, malformed-response, localization, export and layout checks retained. No actual compiler, package, hardware or full domain rerun for this renderer-only change.
