import {z} from 'zod';
export const TimingInputSchema=z.object({firstMs:z.number().int().min(10).max(1000),secondMs:z.number().int().min(10).max(1000),startClock:z.number().int().min(0).max(0xffffffff),stopAt:z.number().int().min(0).max(1500).nullable()}).strict();
export type TimingInput=z.infer<typeof TimingInputSchema>;
export type TimingPhase='first'|'second'|'stopped';
export type TimingEvent={elapsedMs:number;clock:number;phase:TimingPhase};
export const timingHorizonMs=1500,timingStepMs=10;
export function timingComparison(value:unknown){const input=TimingInputSchema.parse(value);const cooperative:TimingEvent[]=[],blocking:TimingEvent[]=[];let phase:TimingPhase='first',phaseAt=input.startClock,last:TimingPhase|undefined,stopSent=false;
 for(let elapsedMs=0;elapsedMs<=timingHorizonMs;elapsedMs+=timingStepMs){const clock=(input.startClock+elapsedMs)>>>0;if(input.stopAt!==null&&!stopSent&&elapsedMs>=input.stopAt){phase='stopped';stopSent=true;}if(phase!=='stopped'&&((clock-phaseAt)>>>0)>=(phase==='first'?input.firstMs:input.secondMs)){phase=phase==='first'?'second':'first';phaseAt=clock;}if(phase!==last){cooperative.push({elapsedMs,clock,phase});last=phase;}}
 const emit=(elapsedMs:number,phase:TimingPhase)=>{if(elapsedMs<=timingHorizonMs)blocking.push({elapsedMs,clock:(input.startClock+elapsedMs)>>>0,phase});};
 for(let elapsed=0;elapsed<=timingHorizonMs;){emit(elapsed,'first');elapsed+=input.firstMs;emit(elapsed,'second');elapsed+=input.secondMs;if(input.stopAt!==null&&elapsed>=input.stopAt){emit(elapsed,'stopped');break;}}
 const response=(events:TimingEvent[])=>{const event=events.find(e=>e.phase==='stopped');return event?{atMs:event.elapsedMs,delayMs:event.elapsedMs-input.stopAt!}:null;};
 return {origin:'bounded-timing-model' as const,input,stepMs:timingStepMs,horizonMs:timingHorizonMs,cooperative,blocking,cooperativeResponse:response(cooperative),blockingResponse:response(blocking),physicalVerification:'NOT RUN' as const};
}
/** Actual C++ lesson core: unsigned elapsed subtraction, stop priority, explicit restart. */
export const cooperativeCore=`#include <stdint.h>
class CooperativeSequence {
 public:
  enum class Phase { First, Second, Stopped };
  bool configure(uint32_t first, uint32_t second) {
    phase=Phase::Stopped;
    configured=first>=1&&first<=60000&&second>=1&&second<=60000;
    if(!configured)return false;
    firstMs=first;secondMs=second;return true;
  }
  bool start(uint32_t now) {
    if(!configured)return false;
    phase=Phase::First;phaseStarted=now;return true;
  }
  Phase tick(uint32_t now, bool stopRequested) {
    if(stopRequested)phase=Phase::Stopped;
    if(phase==Phase::Stopped)return phase;
    const uint32_t interval=phase==Phase::First?firstMs:secondMs;
    if(uint32_t(now-phaseStarted)>=interval) {
      phase=phase==Phase::First?Phase::Second:Phase::First;
      phaseStarted=now; // One transition; no catch-up burst after a delayed call.
    }
    return phase;
  }
 private:
  bool configured=true;
  Phase phase=Phase::Stopped;
  uint32_t firstMs=300,secondMs=700,phaseStarted=0;
};
`;
const readStop=`bool readStop() {
  for(int budget=8;budget>0&&Serial.available();--budget) {
    if(Serial.read()=='s')return true;
  }
  return false;
}
`;
export const nonblockingArtifact={starter:`#include <Arduino.h>
// STUDENT TASK: replace blocking waits; the example prints phases only.
${readStop}
bool stopped=false;
void setup() { Serial.begin(115200); }
void loop() {
  if(stopped)return;
  Serial.println("FIRST");
  delay(300);
  Serial.println("SECOND");
  delay(700);
  if(readStop()) { stopped=true;Serial.println("STOPPED"); }
}
`,reference:`#include <Arduino.h>
${cooperativeCore}
// STUDENT TASK: check stop before phase transitions; do not block the loop.
${readStop}
CooperativeSequence sequence;
CooperativeSequence::Phase displayed=CooperativeSequence::Phase::Stopped;
bool haveDisplayed=false;
void setup() {
  Serial.begin(115200);
  sequence.configure(300,700);
  sequence.start(millis());
}
void loop() {
  const bool stopRequested=readStop();
  const auto phase=sequence.tick(millis(),stopRequested);
  if(haveDisplayed&&phase==displayed)return;
  haveDisplayed=true;
  displayed=phase;
  if(phase==CooperativeSequence::Phase::First)Serial.println("FIRST");
  else if(phase==CooperativeSequence::Phase::Second)Serial.println("SECOND");
  else Serial.println("STOPPED");
}
`};
