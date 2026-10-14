# L45 collision and boundary scenarios — foundation only

Three fixed supported-block simulations compare unguarded timed drive with validity-aware threshold stopping. The wall case records actual collision; the narrow case uses a 0.2 m opening smaller than the robot's 0.24 m diameter. An ideal zero-width distance ray can miss passage side walls, so sensor validity alone does not prove body clearance. In these particular scenarios the corrected algorithm stops, avoiding the observed collision. This is not a general navigation or physical safety guarantee.

The range case starts beyond the sensor model's supported distance and verifies that corrected motion remains stopped. A separate x=0 start is explicitly rejected rather than silently relocated. Goals are clear of obstacles, isolating the intended passage failure. Six 300-step traces, world/program snapshots, units and source hashes are preserved; identical reruns match exactly.

Verification: 395 tests across 131 files, 96.33% branches with unchanged per-file gates; typecheck and lint pass. The source-bundled checker executes the actual simulator and retains raw evidence. [Receipt](../evidence/collision-cases/verification.json).

L45 is not registered or packaged. Trilingual theory, checked learner tasks, responsive scenario UI, course registration and end-to-end checks remain. Course remains 44/60; published 0.8.11 unchanged. Physical verification remains NOT RUN.
