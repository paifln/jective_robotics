# Board profile exchange foundation

The new profile exchange module encodes and decodes a strict version-1 JSON envelope with a 128 KiB UTF-8 input bound. Imported profiles validate identifier/version formats, description/provenance bounds, supported baud rates, chip GPIO range, duplicate GPIOs, PWM/output and analog/input consistency, provisional indicator assignment and indicator exposure/output/reservation. Reference boot-sensitive GPIOs remain explicitly flagged rather than silently reassigned.

Three tests round trip all existing reference/provisional profiles and Unicode descriptions without mutating the registry, and reject malformed/unsupported envelopes and inconsistent definitions. All 96 unit/integration tests passed; type checking and lint passed. Aggregate domain branch coverage is 768/847 (90.67 percent); exchange module coverage is 97.56 percent. The unchanged per-file gate passes.

This is an exchange foundation, not completed custom-profile integration. UI import/export, persistent registry, project-specific version/hash resolution, migration review and hardware capability adapters still require implementation. Imported descriptions are user claims, not verified electrical evidence. Published 0.4.0 artifacts are unchanged. Reports are retained in evidence/wip-profile-exchange.
