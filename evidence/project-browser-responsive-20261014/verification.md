# Project search responsiveness

Search changes and Show more now request only project metadata; workspace recovery and snapshots load on entering the browser or an explicit refresh. Text search is delayed 180ms after the latest edit. Cleanup cancels pending timers and invalidates old responses. Metadata is marked loaded only after a successful current response, so an interrupted initial load can retry.

Source Electron project-browser and reading tests passed (2 tests). A follow-up project-browser test passed with a deliberately held old search response released after the next search completed: latest title remained unchanged. Source-only IPC wrappers preserved original guarded handlers; they also confirmed one list call and zero workspace/snapshot calls for a settled search change. Build, typecheck and lint passed before the final test-only held-response addition.

Previous full unit baseline is 552 passing tests; not rerun for this hook-only turn. Source-only changes: no package replacement, production benchmark, physical hardware, installer or Windows 10 verification.
