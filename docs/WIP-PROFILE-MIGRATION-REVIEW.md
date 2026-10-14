# Profile migration review foundation

The migration comparison module validates two definitions of the same profile ID, records both version/hash pairs, lists changed metadata and added/removed/changed GPIOs, and checks the existing logical wiring against the proposed definition. It returns blocking capability/provisional issues and nonblocking boot-sensitive review issues without changing either definition or remapping pins. Physical verification is explicitly NOT RUN.

Tests cover metadata changes, GPIO additions/removals/capability changes, preserved input data, unsupported mappings, provisional definitions, unrelated identifiers and pin-order-independent identity. All 108 unit/integration tests passed, with type checking and lint. Aggregate domain branch coverage is 818/898 (91.09 percent); the unchanged per-file threshold passes.

This comparison is not yet a migration UI or a project mutation workflow. Custom profile selection and version-pinned compiler/project integration remain incomplete. Published 0.4.0 artifacts are unchanged. Evidence is retained in evidence/wip-profile-migration-review.
