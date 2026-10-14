# Profile registry Electron bridge

The main process now creates its persistent board-profile registry under the application's user-data directory. Typed preload methods expose list, JSON-text import and version/hash-selected JSON export. Existing sender/main-frame/origin checks protect all three handlers; main-process validation remains authoritative. No caller-controlled filesystem path is accepted by these methods.

A real source Electron scenario imports a Unicode custom profile through preload, verifies its actual file, rejects replacement and invalid JSON, restarts Electron, retrieves the profile and exports only the expected hash. The scenario passed. Type checking and lint passed. The initial test attempted IPC before renderer navigation completed; the corrected scenario waits for the actual studio to load before invoking either process's bridge.

The bridge is not yet a user-facing import flow. Custom profiles cannot yet be selected by projects, whose schema and compiler still use bundled profile identifiers. UI import/export, version-pinned project resolution and reviewed migration remain incomplete. Published 0.4.0 artifacts are unchanged. E2E evidence is retained in evidence/wip-profile-ipc/e2e.json.
