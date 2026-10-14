# Scenario geometry and export provenance

Current source validates complete obstacle rectangles, line endpoints and goal circles against world dimensions. It rejects initial robot footprints intersecting the world boundary or an obstacle, using the configured robot radius. Wall-aligned and overlapping obstacle rectangles remain permitted. All six shipped world fixtures pass these checks.

The scenario editor applies only validated scenarios. Custom scenario IDs remain visible in the world selector. Changing worlds invalidates the previous worker operation and clears pending state, history and the captured program. Scenario exports explicitly identify their origin as simulation and include the program captured at worker initialization instead of rereading potentially changed current blocks.

Strict TypeScript and ESLint passed. All 35 unit/integration tests passed, including out-of-world geometry, invalid footprints and valid boundary cases. Two source Electron scenarios passed: the existing world/serial/classroom workflow and a new editor test which rejects an outside goal, verifies the previous world remains selected, accepts a custom scenario, initializes its actual worker, exports a real JSON file and checks simulation origin and starting pose. Reports are in `evidence/wip-world-validation`.

These checks do not establish route reachability, physical accuracy or installed-executable behavior. Export capture/history reset were inspected in source; the new Electron test verifies an accepted single scenario, not every possible cross-run editing sequence. Published 0.2.0 artifacts remain unchanged and the full specification remains unfinished.
