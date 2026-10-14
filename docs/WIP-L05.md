# Message evidence lesson after release 0.2.0

Current source adds L05, Serial messages as evidence, with 711 learner-facing English words, complete draft Kazakh/Russian translations, three assessments, and real block starter/reference projects. It teaches event labels, intention versus observation, model timestamps versus desktop receipt timestamps, evidence origin and why printed text cannot prove movement. The learner exports the actual simulation JSON and extracts a short labelled log while retaining its source.

Strict TypeScript and ESLint passed. All 31 unit/integration tests passed. A new Electron scenario loaded the L05 reference, ran the actual worker, exported through Electron's real download event and read the resulting file. It verified `origin: simulation` and the five expected messages at 0, 0, 250, 1000 and 1250 milliseconds. This was a targeted source-app check, not a new installer test or hardware test. Reports are preserved under `evidence/wip-l05`.

The working tree now has five lessons; 55 required lessons and technical translation review remain unfinished. No physical board was opened or uploaded for this lesson. Published 0.2.0 installer/source ZIP still contain their original two-lesson snapshot; their checksums are unchanged.
