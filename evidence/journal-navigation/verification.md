# Journal navigation recovery

History now changes only after a successfully validated page response. Failed forward/backward reads retain the displayed page and navigation history. Existing stale-request protection remains.

Build and Electron UI scenario passed (5.0s). The real sandboxed preload rejects the malformed fixture response; UI retains FIRST and Previous stays disabled after failed Next. Existing successful forward/back, keyboard, localized labels, export and800px controls checks also pass. Explicit IPC fixtures; not actual compiler/hardware acceptance. No new domain logic; full domain run was not repeated for this renderer-only change.
