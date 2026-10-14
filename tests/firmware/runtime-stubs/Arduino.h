#pragma once
// Host boundary substitutes: no GPIO, PWM, RTOS thread or serial device is real.
#include <cstdint>
#include <cstdio>
#include <cstring>
#include <cmath>
#include <string>
#include <cstdarg>
namespace host {
inline uint32_t now=0;inline int pinModes=0,writes=0,attachments=0,tasks=0,serialCalls=0,deletedTasks=0;inline uint32_t pwm[64]{};
inline int failAttachment=0;inline bool taskSucceeds=true;inline std::string serialLog;inline const char* profilePointer=nullptr;
inline void reset(){now=0;pinModes=writes=attachments=tasks=serialCalls=deletedTasks=0;failAttachment=0;taskSucceeds=true;serialLog.clear();profilePointer=nullptr;for(auto &value:pwm)value=0;}
}
constexpr int LOW=0,HIGH=1,OUTPUT=1,INPUT_PULLUP=2,INPUT_PULLDOWN=3;
inline void pinMode(int,int){++host::pinModes;}
inline void digitalWrite(int,int){++host::writes;}
inline int digitalRead(int){return HIGH;}
inline uint32_t millis(){return host::now;}
inline void delay(uint32_t ms){host::now+=ms;}
inline bool ledcAttach(int,int,int){return ++host::attachments!=host::failAttachment;}
inline void ledcWrite(int pin,uint32_t duty){++host::writes;host::pwm[pin]=duty;}
using portMUX_TYPE=int;
#define portMUX_INITIALIZER_UNLOCKED 0
#define portENTER_CRITICAL(mux) ((void)(mux))
#define portEXIT_CRITICAL(mux) ((void)(mux))
using TaskHandle_t=void*;using TickType_t=uint32_t;
constexpr int pdPASS=1,configMAX_PRIORITIES=25;
inline int xTaskCreate(void(*)(void*),const char*,int,void*,int,TaskHandle_t* task){++host::tasks;if(!host::taskSucceeds){*task=reinterpret_cast<void*>(99);return 0;}*task=reinterpret_cast<void*>(1);return pdPASS;}
inline void vTaskDelete(TaskHandle_t){++host::deletedTasks;}
inline TickType_t xTaskGetTickCount(){return host::now;}
inline uint32_t pdMS_TO_TICKS(uint32_t ms){return ms;}
inline void vTaskDelayUntil(TickType_t*,uint32_t){}
class String {
 std::string value;
 public:String(const char* text):value(text){}String(unsigned long number):value(std::to_string(number)){}
 String operator+(unsigned long number)const{return String((value+std::to_string(number)).c_str());}
 String operator+(const char* text)const{return String((value+text).c_str());}
 String operator+(const String& other)const{return String((value+other.value).c_str());}
 const char* c_str()const{return value.c_str();}
};
struct StubSerial {
 void begin(int){++host::serialCalls;}
 void println(const char* text){++host::serialCalls;host::serialLog+=text;host::serialLog+='\n';}
 int available(){return 0;}char read(){return '\0';}
 void printf(const char* format,...){++host::serialCalls;char text[2048];va_list args;va_start(args,format);if(strstr(format,"hello")){va_list peek;va_copy(peek,args);host::profilePointer=va_arg(peek,const char*);va_end(peek);}vsnprintf(text,sizeof(text),format,args);va_end(args);host::serialLog+=text;}
};
inline StubSerial Serial;
struct StubESP {unsigned long long getEfuseMac(){return 123;}};
inline StubESP ESP;
