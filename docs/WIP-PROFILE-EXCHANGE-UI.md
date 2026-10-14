# Profile exchange interface

The wiring tab now includes a localized profile exchange panel. Users can read a bounded JSON file or paste a definition, validate and import it, choose a stored version and download its JSON. Main-process registry validation remains authoritative, and export computes the selected definition hash before asking the bridge for that exact version. The panel states that imported descriptions do not establish physical wiring and that custom project selection remains unavailable.

A real Electron UI scenario rejects malformed JSON without registering it, imports a custom profile and exports the actual stored definition to a file whose decoded contents match the input. The scenario passed. Electron downloads were captured through its session will-download handler and verified on disk; an initial browser-page download-event wait was unsuitable for this Electron harness. Type checking and lint passed.

This adds the exchange flow but does not complete custom project selection, compiler profile resolution or reviewed migration. Published 0.4.0 artifacts remain unchanged. Reports are retained in evidence/wip-profile-exchange-ui/e2e.json.
