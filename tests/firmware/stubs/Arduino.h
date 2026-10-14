#pragma once
#include <cstdint>
constexpr int LOW=0, HIGH=1, OUTPUT=1, INPUT_PULLUP=2;
extern uint32_t testNow;
extern int testStop;
extern int testPins[32];
inline void digitalWrite(int pin,int value){testPins[pin]=value;}
inline int digitalRead(int){return testStop;}
inline void pinMode(int,int){}
inline uint32_t millis(){return testNow;}
struct StubSerial {void begin(int){} void println(const char*){}};
inline StubSerial Serial;
