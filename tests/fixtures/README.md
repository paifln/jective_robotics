# Recorded compiler cases

`recorded-compiler-cases.json` is an unmodified copy of the small historical receipt originally written to `evidence/build-errors/compiler.json` on 11 October 2026. It records four actual Arduino CLI 1.5.1 / ESP32-core fault-and-correction pairs. The original remains local; the fixture is included in Git so ordinary unit tests do not depend on ignored generated evidence or a locally installed SDK.

SHA-256: `819714b205b27ad2d2f0dfc626369eddeda3a29d085baefc4e7273d864768e11`.

These tests replay recorded inputs and logs. They do not run a compiler, upload a program, verify current hardware or certify a current installer. Historic paths and operation IDs identify those recorded diagnostics; they are not current machine configuration. New live compiler verification is separate and scoped to its own artifact/report.
