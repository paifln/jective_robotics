# Curriculum dependency and guide-link checks

New reusable domain validator detects duplicate lesson/guide IDs, missing/duplicate/self prerequisites, dependency cycles and missing/duplicate guide lesson references. The existing content gate now invokes it before reporting content completeness. It retains the human-review gate.

All60actual lesson prerequisites and8guide reference sets pass graph checks. Three targeted tests also reject malformed dependencies and guide links, and accept unordered definitions/shared prerequisites. Full530tests/179files pass with96.34% package branch coverage and per-file thresholds. Typecheck/lint pass. content:validate exits1 / NOT COMPLETE: Translations require human technical language review. The failure is preserved in content-report.json and is not suppressed. Structural validity and word counts do not establish pedagogical or equivalent-language acceptance. No package, compiler or physical verification performed for this validator change.
