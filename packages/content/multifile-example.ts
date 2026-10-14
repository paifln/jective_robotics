import type {SourceFiles} from '../contracts/source-files';
/** Serial-only source for the forthcoming multi-file lesson; no GPIO assignment. */
export const multiFileExample:{source:string;sourceFiles:SourceFiles}={source:`#include <Arduino.h>
#include "behavior.h"
// STUDENT TASK: keep configuration and behavior in separate project files.
uint32_t started=0;
const char* displayed=nullptr;
void setup(){Serial.begin(115200);started=millis();}
void loop(){
  const char* phase=behavior::phase(uint32_t(millis()-started));
  if(phase!=displayed){Serial.println(phase);displayed=phase;}
}
`,sourceFiles:{'config.h':`#pragma once
#include <stdint.h>
namespace config {
constexpr uint32_t firstMs=300,secondMs=700;
static_assert(firstMs>0&&firstMs<=1000&&secondMs>0&&secondMs<=1000,"Bound each phase");
}
`,'behavior.h':`#pragma once
#include <stdint.h>
namespace behavior {const char* phase(uint32_t elapsedMs);}
`,'behavior.cpp':`#include "behavior.h"
#include "config.h"
namespace behavior {
const char* phase(uint32_t elapsedMs){
  constexpr uint32_t cycle=config::firstMs+config::secondMs;
  return elapsedMs%cycle<config::firstMs?"FIRST":"SECOND";
}
}
`}};
export const invalidMultiFileExample={...multiFileExample,sourceFiles:{...multiFileExample.sourceFiles,'behavior.cpp':multiFileExample.sourceFiles['behavior.cpp']!.replace('config::firstMs?','config::unknownPhase?')}};
