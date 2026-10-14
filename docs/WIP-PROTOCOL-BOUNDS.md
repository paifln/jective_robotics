# Bounded protocol fields and frame recovery

Current source bounds telemetry/acknowledgement sequence fields to unsigned 32-bit integers, requires nonempty identity/error/command strings and limits telemetry to 64 nonempty named finite-number fields. This validates data; it does not authenticate a physical device.

The parser now keeps only a bounded partial line. Once a line exceeds the limit, it emits an error and discards the remainder through the next newline, preventing the tail of a malformed frame from being interpreted as a fresh protocol message. Following valid lines are processed normally. Valid CRLF lines with 4096 content characters are accepted even when the delimiter arrives in a separate chunk. Large chunks containing many individually valid lines are handled without treating the entire chunk as a single oversized frame. Per-call results are bounded at 2000 events with an explicit truncation error.

Verification: TypeScript, ESLint and all 40 unit/integration tests passed. New cases cover oversized split-frame recovery, reset, a valid 40KB multi-line batch, explicit flood truncation, maximum-length split CRLF, unsigned sequence boundaries, telemetry field count and empty protocol fields. Source Electron serial-export and existing port/classroom/world scenarios are checked separately. Physical serial traffic and actuator safety are NOT RUN; these parser checks must not be presented as hardware validation.

Published installer/source ZIP remain unchanged. Broader protocol integration, movement authorization, telemetry plotting and full release acceptance remain unfinished.
