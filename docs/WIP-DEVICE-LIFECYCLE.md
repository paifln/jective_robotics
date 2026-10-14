# Serial connection lifecycle

Current source reserves the device service while asynchronous enumeration, opening or closing is in progress. Concurrent open/close/send attempts return PORT_BUSY. The active port remains owned until closing finishes; callbacks from a retired port cannot clear another connection's parser, timer or events. Send captures the current port instead of dereferencing mutable state inside its callback. Failed enumeration/opening releases the transition reservation. If close fails while the port remains open, event delivery resumes and the error is returned.

Two explicit fake-transport tests exercise the real DeviceService implementation: concurrent attempts during enumeration/open/close; stale close/data events after reconnect; distinct connection IDs and correct baud provenance; continued receipt/send after a failed close; failed enumeration/open followed by a successful retry. No physical port is represented as tested hardware. These checks validate software lifecycle behavior only.

All 44 unit/integration tests passed. TypeScript and ESLint passed. Source Electron port-enumeration/classroom/world and serial-export scenarios passed before the final close-failure recovery helper was added; those scenarios do not open a physical port. The final helper is covered by the fake-transport test. Reports are preserved under `evidence/wip-device-lifecycle`. An unused test import initially failed ESLint and was removed before the passing lint run.

Actual physical reconnect, driver faults, upload and actuation remain NOT RUN. Published 0.2.0 artifacts are unchanged. The full specification remains unfinished.
