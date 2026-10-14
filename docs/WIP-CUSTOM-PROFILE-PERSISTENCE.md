# Custom profile persistence validation

Custom embedded definitions are now hash-verified during project-file reads/writes and SQLite project/snapshot/recovery reads/writes, including backup inspection. A valid saved file remains untouched if an attempted replacement contains altered profile data. Backup restoration refuses an altered custom definition rather than reconstructing it as a trusted project. Legacy bundled metadata remains subject to explicit migration at save/build boundaries; older backups can still retain it for review.

Two real-filesystem/SQLite tests verify reopening, snapshot restoration, transfer into a fresh backup target and tampered definition rejection. All 113 unit/integration tests passed with aggregate branch coverage 847/926 (91.46 percent). Type checking and lint passed. Two source Electron scenarios for backup restoration and custom profile save/reopen passed in 5.9 seconds. Real compilation was not enabled in this latest targeted run; the earlier actual custom-profile compilation remains separately evidenced.

Nested classroom projects and portable archive read boundaries still need the same binding validation. This does not prove power-loss recovery or physical wiring. Published 0.4.0 artifacts remain unchanged. Reports are retained in evidence/wip-custom-profile-persistence.
