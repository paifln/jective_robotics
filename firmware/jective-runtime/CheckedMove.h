#pragma once
#include "JectiveRuntime.h"
namespace jective {
enum class MoveResult { Accepted, InvalidInput, RuntimeRejected };
// left/right: percent duty in [-30,30]. durationMs: whole milliseconds [1,2000].
// Invalid/rejected commands disarm; acceptance is not physical-motion evidence.
inline MoveResult checkedMove(Runtime &robot,float left,float right,int64_t durationMs) {
  if(!isfinite(left)||!isfinite(right)||fabsf(left)>30||fabsf(right)>30||durationMs<1||durationMs>2000){robot.stop();return MoveResult::InvalidInput;}
  if(!robot.drive(left,right,static_cast<uint32_t>(durationMs))){robot.stop();return MoveResult::RuntimeRejected;}
  return MoveResult::Accepted;
}
}
