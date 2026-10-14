# L22 motor-ramp groundwork

The working tree compares a requested command with the bounded controller-model output, using an autonomous software model with stop input declared available. It requests +20 percent at zero, reverses to −20 at 600 ms and explicitly disarms at 1200 ms. The abruptly copied command is a hypothetical reference, not output from firmware or a real motor. The graph renders that reference as steps and the sampled controller output separately.

The controller ramps at 40 percentage points per second and forces zero when direction reverses. At the 20 ms observation grid, zero outputs occur at 600, 620 and 640 ms; the first negative output is at 660 ms. Thus the observed zero interval is 60 ms, consistent with a minimum 50 ms pause. These are sampled software values, not measured electrical stress, wheel speed or braking time. A disarm can change output immediately and is distinct from an ordinary target ramp.

scripts/motor-ramp-check.mjs compiles and executes the actual C++ SafetyController header on the host, then compares all 71 output/state samples with TypeScript at a 1e-5 percentage-point tolerance. This proves matching for the fixed reversal scenario only; it does not prove ESP32 scheduling or physical behavior. G04 exposes the trilingual panel and JSON export. Current proof is under evidence/motor-ramp.

L22 is now registered as an authored draft lesson in EN/KK/RU with 796 learner-facing English words, three explained questions, checked concept/numeric practice, a comparison table activity and a four-point evidence rubric. The panel is accessible directly from the lesson as well as G04. Its waveform screenshot exposed an inherited dark SVG background in light mode; the scoped motor/steering graphs now use the active surface and text colors so labels and dashed references remain readable.

Curriculum is now 22/60; 38 lessons and technical translation review remain. Published 0.7.0 artifacts remain unchanged. Current lesson proof is under evidence/L22; evidence/motor-ramp preserves the earlier domain/panel snapshot.
