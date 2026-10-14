#include <cassert>
#include <cstdint>
#include <iostream>
uint32_t testNow=0;
int testStop=1;
int testPins[32]={};
#define JECTIVE_INDICATOR_ONE_PIN 2
#define JECTIVE_INDICATOR_TWO_PIN 4
#define JECTIVE_STOP_PIN 5
#include "../../examples/two-indicator-cooperative.ino"
int main(){
 setup();assert(testPins[2]==0&&testPins[4]==0);
 loop();assert(testPins[2]==1&&testPins[4]==0);
 testNow=299;loop();assert(testPins[2]==1&&testPins[4]==0);
 testNow=300;loop();assert(testPins[2]==0&&testPins[4]==1);
 testNow=350;testStop=0;loop();assert(stopped&&testPins[2]==0&&testPins[4]==0);
 testStop=1;testNow=1000;loop();assert(testPins[2]==0&&testPins[4]==0);
 stopped=false;secondPhase=false;testNow=0xffffff00u;setup();loop();
 testNow=uint32_t(0xffffff00u+299u);loop();assert(testPins[2]==1);
 testNow=uint32_t(0xffffff00u+300u);loop();assert(testPins[4]==1&&testPins[2]==0);
 std::cout<<"PASS: startup, intervals, immediate next-call stop, stop latch, counter rollover; host stub only, physical NOT RUN\n";
}
