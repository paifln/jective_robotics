# Packaged compiler journey: incomplete

The owned verification process finished with exit 1. The intentionally invalid sketch is verified: real compiler exit 1, no artifacts, equal raw/UI journal, 222534 ms including SDK checks. Corrected-source compilation reached the post-compile SDK integrity stage, but did not publish State: succeeded before the helper's 360000 ms observation deadline plus final 5000 ms assertion. The helper then closed its owned test application. No live job remains from this run.

Do not report this as a successful current packaged compiler/restart journey. The corrected build's final integrity/artifact manifest and restart recovery remain unverified. The copied fixture and failure screenshot/report are retained. No Windows10, upload or physical verification.

Next work is to measure the integrity scanner bottleneck and preserve its full content/security checks while improving throughput. Do not simply turn this timeout into a pass or restart the same work solely because observation expired.
