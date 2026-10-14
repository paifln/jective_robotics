// L04 comparison template. No physical pin mapping is implied.
// Teacher-reviewed active-high indicators and active-low stop input required.
#include <Arduino.h>
#ifndef JECTIVE_INDICATOR_ONE_PIN
#error Define JECTIVE_INDICATOR_ONE_PIN after reviewing the actual board and wiring
#endif
#ifndef JECTIVE_INDICATOR_TWO_PIN
#error Define JECTIVE_INDICATOR_TWO_PIN after reviewing the actual board and wiring
#endif
#ifndef JECTIVE_STOP_PIN
#error Define JECTIVE_STOP_PIN after reviewing the actual input circuit
#endif
static_assert(JECTIVE_INDICATOR_ONE_PIN != JECTIVE_INDICATOR_TWO_PIN);
static_assert(JECTIVE_STOP_PIN != JECTIVE_INDICATOR_ONE_PIN && JECTIVE_STOP_PIN != JECTIVE_INDICATOR_TWO_PIN);
bool secondPhase = false;
bool stopped = false;
uint32_t phaseStarted = 0;
void outputs(bool first, bool second) {
  digitalWrite(JECTIVE_INDICATOR_ONE_PIN, first ? HIGH : LOW);
  digitalWrite(JECTIVE_INDICATOR_TWO_PIN, second ? HIGH : LOW);
}
void setup() {
  digitalWrite(JECTIVE_INDICATOR_ONE_PIN, LOW);
  digitalWrite(JECTIVE_INDICATOR_TWO_PIN, LOW);
  pinMode(JECTIVE_INDICATOR_ONE_PIN, OUTPUT);
  pinMode(JECTIVE_INDICATOR_TWO_PIN, OUTPUT);
  pinMode(JECTIVE_STOP_PIN, INPUT_PULLUP);
  phaseStarted = millis();
  // First output is activated only after the first loop checks stop.
}
void loop() {
  if (digitalRead(JECTIVE_STOP_PIN) == LOW) stopped = true;
  if (stopped) { outputs(false, false); return; }
  const uint32_t now = millis();
  const uint32_t interval = secondPhase ? 700 : 300;
  if (uint32_t(now - phaseStarted) >= interval) {
    secondPhase = !secondPhase;
    phaseStarted = now; // No catch-up burst; execution delays can cause drift.
  }
  outputs(!secondPhase, secondPhase);
}
