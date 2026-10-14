#pragma once
#include <stdint.h>
#include <math.h>
namespace jective {
enum class Mode : uint8_t { Disarmed, Tethered, Autonomous };
struct Output { float left; float right; bool armed; };
// Pure logic. Caller serializes access. Units: percent duty; milliseconds.
class SafetyController {
 public:
  Mode mode = Mode::Disarmed;
  bool fault = false;
  float left = 0, right = 0;
  uint32_t sequence = 0;
  bool arm(uint32_t now, bool autonomous, bool stopAvailable) {
    if (fault || (autonomous && !stopAvailable)) return false;
    disarm(); mode = autonomous ? Mode::Autonomous : Mode::Tethered;
    authorityAt = now; lastTick = now; sequence = 0; return true;
  }
  void disarm() { mode = Mode::Disarmed; targetLeft = targetRight = left = right = 0; reversingLeft = reversingRight = false; }
  void fail() { fault = true; disarm(); }
  bool heartbeat(uint32_t seq, uint32_t now) {
    if (mode != Mode::Tethered || seq <= sequence) return false;
    sequence = seq; authorityAt = now; return true;
  }
  bool drive(float requestedLeft, float requestedRight, uint32_t duration, uint32_t seq, uint32_t now) {
    if (mode == Mode::Disarmed || !isfinite(requestedLeft) || !isfinite(requestedRight) || fabsf(requestedLeft) > 30 || fabsf(requestedRight) > 30 || duration == 0 || duration > 2000 || seq <= sequence) return false;
    sequence = seq; targetLeft = requestedLeft; targetRight = requestedRight; motionAt = now; motionDuration = duration; return true;
  }
  Output tick(uint32_t now, bool physicalStop) {
    if (physicalStop || fault || (mode == Mode::Tethered && uint32_t(now-authorityAt) >= 400)) disarm();
    if (mode == Mode::Disarmed) return {0,0,false};
    if (uint32_t(now-motionAt) >= motionDuration) targetLeft = targetRight = 0;
    const uint32_t elapsed = uint32_t(now-lastTick); lastTick = now;
    const float increment = (elapsed > 20 ? 20 : elapsed) * .04f;
    left = ramp(left,targetLeft,increment,now,reversingLeft,reverseAtLeft);
    right = ramp(right,targetRight,increment,now,reversingRight,reverseAtRight);
    return {left,right,true};
  }
 private:
  float targetLeft=0,targetRight=0;
  uint32_t authorityAt=0,lastTick=0,motionAt=0,motionDuration=0,reverseAtLeft=0,reverseAtRight=0;
  bool reversingLeft=false,reversingRight=false;
  static float ramp(float current,float target,float increment,uint32_t now,bool &reversing,uint32_t &reverseAt) {
    if (current*target < 0) { reversing=true; reverseAt=now; return 0; }
    if (reversing) { if(uint32_t(now-reverseAt)<50)return 0; reversing=false; }
    float delta=target-current;if(delta>increment)delta=increment;if(delta<-increment)delta=-increment;
    float result=current+delta;return fabsf(result)<.01f?0:result;
  }
};
}
