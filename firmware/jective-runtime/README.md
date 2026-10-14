# JECTIVE experimental motor runtime

Target: pinned Arduino ESP32 core 3.3.12. `JectiveRuntime.h` provides direction/enable and dual-input H-bridge adapters using core 3 `ledcAttach`/`ledcWrite`. The two outputs per wheel are logical roles; they are not an official JECTIVE pinout. Select pins through board capability validation before using a configuration. Driver ratings, active-low enables, standby requirements and brake semantics are not interchangeable: these adapters support active-high drive with all-low coast only. Unsupported hardware must not use them.

The pure `SafetyController` starts disarmed. Duty is signed percentage, limited to ±30; duration is 1–2000 ms, acceleration 40 percentage points/second, reversal forces zero for at least 50 ms. Tethered authority expires at 400 ms by unsigned subtraction, including timer rollover. A 10 ms independent FreeRTOS task owns motor outputs, so a blocked student loop does not normally prevent the stop task. These are software design targets, not measured or certified stop times. Interrupt disabling, higher priority starvation, arbitrary direct GPIO access, damaged hardware and supply failures remain outside this guarantee.

Autonomous arming requires an assigned physical stop input and an explicit call. It does not require a host heartbeat. Physical stop disarms; reconnect never arms automatically. `stop()` disarms; `wait()` polls bounded serial input and yields. Raw student code can bypass the library.

Outbound frames are bounded JSON preceded by `@JECTIVE `. Incoming reviewed runtime commands use exact ASCII framing:

`@JECTIVE1 SESSION VERB SEQUENCE CHALLENGE LEFT RIGHT DURATION_MS\n`

Verbs: arm, heartbeat, drive, stop, disarm. Each field is mandatory; unused numeric fields are zero. The device issues a random challenge every 100 ms; arm, heartbeat and drive require the current unused challenge, preventing old buffered heartbeats from renewing authority. Only heartbeat refreshes tethered authority. Sequence values must increase for heartbeat and drive. Stop/disarm require the current session but can bypass sequence ordering. Malformed/oversized input is discarded through the next newline. The desktop raw monitor rejects `@JECTIVE` commands; host movement controls remain unavailable until protocol integration and identified physical hardware verification are complete.

Bench protocol: disconnect motor power, inspect all pins and supply ratings, verify all outputs inactive at startup; raise wheels and use a current-limited motor supply with physical disconnect. Record exact board/driver revisions and test normal stop, 400 ms communication loss, reset, malformed commands, reversal, stuck loop and physical stop. Measure outputs and latency with a suitable instrument. Every physical case is **NOT RUN** on this workstation.
