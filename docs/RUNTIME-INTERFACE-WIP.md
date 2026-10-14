Current 0.8.7 registers L39 with the real runtime source, native-case comparison and learner helper correction. Assertion-enabled checks supersede earlier assert-disabled native claims; see [correction](ASSERTION-CORRECTION.md) and [current scope](RELEASE-0.8.7.md). Curriculum is 39/60. Earlier preparation notes below retain their historical scope.

# Runtime interfaces and L39 preparation

Current source adds `firmware/jective-runtime/CheckedMove.h` and hardens `JectiveRuntime.h`. This is experimental firmware/API work for the remaining hardware requirements and L39. **L39 is not yet registered** in the learning UI; curriculum remains 38/60. The published 0.8.6 installer and its evidence are unchanged, and this work is not a claim that it uploads or executes this motor runtime.

`Runtime::begin` validates all declared motor-pin uniqueness, stop-pin conflicts, driver enum and a bounded ASCII profile ID before GPIO/PWM/task calls. This is not complete board-specific electrical pin validation. It copies the profile name into owned storage, avoiding reliance on the caller's string lifetime and JSON-breaking characters in the handshake. Negative motor pins and invalid optional-stop sentinels are rejected. Initialization failure does not permit `armAutonomous`, `drive`, `poll` or `wait`; attach/task failures latch the existing fault. A started runtime cannot be reconfigured and cannot create a second task. A rejected repeated `begin` disarms the existing controller.

A Runtime owns its background task. Copy/move construction and assignment are deleted; functions receive it by reference. Destruction disarms the controller, deletes the owned task and commands zero outputs. An unsuccessful task creation does not establish task ownership. These source-level guarantees still require physical shutdown/latency verification, actual FreeRTOS scheduling tests and integration with the rest of the hardware stack.

## Helper contract

`jective::checkedMove(Runtime &robot, float left, float right, int64_t durationMs)` returns `MoveResult`:

- `left` and `right` are finite percent-duty requests in [-30, 30]. They are not centimetres, speed in metres per second or measured wheel speed.
- `durationMs` is a whole duration from 1 to 2000 milliseconds. A signed argument is validated before conversion to the runtime's unsigned duration.
- `Accepted` means `Runtime::drive` admitted the request. It does not prove any wheel moved or that the physical wiring is correct.
- `InvalidInput` means the helper rejected a bound, nonfinite speed or invalid duration. It disarms the runtime.
- `RuntimeRejected` means valid helper inputs were refused by the runtime (for example, uninitialized or not armed). It also disarms. The caller must check the enum explicitly; `Accepted` is not a truthy Boolean.

```cpp
const auto result = jective::checkedMove(robot, 10, 10, 100);
if (result != jective::MoveResult::Accepted) {
  // Already disarmed. Report the rejection; do not automatically retry/arm.
}
```

The compile fixture deliberately never calls `begin` or arms a motor. It exercises real helper/runtime signatures for ESP32 and ESP32-C3. No undocumented JECTIVE carrier pinout is introduced.

## Reproducible checks

Run `node scripts/runtime-interface-check.mjs`. The host C++ test includes the actual runtime, safety core and helper headers. Only hardware/RTOS boundaries are substituted, explicitly under `tests/firmware/runtime-stubs`. It checks before-initialization calls, whole-configuration rejection before effects, every partial DualInput attach failure, task failure/retry, no autonomous stop input, successful boundaries, invalid/nonfinite inputs, disarming on rejection, profile-string ownership, repeat-begin behavior and noncopyable task ownership/destruction. The host does not run the FreeRTOS task, exercise serial command parsing or verify real peripheral timing. Its GPIO/PWM records are software observations, not motor measurements.

The same script performs actual Arduino CLI builds for both board targets and records source hashes, logs and artifacts in `evidence/runtime-interface/verification.json`. Prior checks before final ownership changes are retained separately. Physical upload, physical emergency stop, electrical compatibility and the full generator/host motion integration remain NOT RUN or incomplete. Next curriculum work is substantial trilingual L39 theory, real-API parameter/return/failure exercises, an independent text task and learner-facing evidence export.
