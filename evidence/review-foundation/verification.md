# Offline review foundation (source only)

The review contracts, context digest, archive validation and transactional import helpers are implemented. Five workflow tests cover five independent learner databases, two assignments, a reviewer database, feedback return, duplicate handling and actual SQLite backup/restore. They also cover source/rubric changes, foreign IDs, score boundaries, known credential patterns, duplicate/traversal ZIP entries and transaction rollback on conflicting submissions. Grades in these tests are synthetic fixtures, not human review.

The SHA-256 context digest binds the exact assignment and submitted project; it does not authenticate a reviewer. The file marks reviewer identity as unverified. Imports do not open a project, change recovery or execute code. Conflicting feedback for an already graded submission is rejected rather than overwritten. Known credential detection is heuristic; manual inspection of all shared source remains required. Owner assistant configuration is outside the review contract.

The full source suite passed 457 tests with 96.70% branch coverage; typecheck, lint and renderer build passed. Learner/reviewer UI, native review IPC and L53 lesson registration are still pending. The course remains 52/60. Published installer 0.8.16 does not include this foundation or the later editor expansion change.
