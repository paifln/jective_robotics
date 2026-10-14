# Snapshot open confirmation

Extended isolated source Electron project-browser journey: create a real saved version using UI, dismiss unsaved-change confirmation and assert zero restoreSnapshot IPC calls with version list still visible; accept confirmation and assert one real guarded call and Studio visible. Existing project-open cancel/accept, initial/stale search, pagination, partial errors and keyboard checks also pass in the same test.

Test-only change; source implementation came from the preceding read/open split. IPC wrappers count original handlers without replacing their behavior. No exact physical/hardware/installer or latest production package verification claim. A zero restore call proves cancellation never reaches that binding-reset action; this test does not independently re-save a bound file after snapshot cancellation.
