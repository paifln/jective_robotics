#pragma once
#include <Arduino.h>
#include <esp_system.h>
#include "SafetyController.h"
namespace jective {
enum class Driver { DirectionEnable, DualInput };
struct MotorPins { int first; int second; };
struct Configuration { Driver driver; MotorPins left,right; int physicalStop; bool stopActiveLow; const char *profile; };
class Runtime {
 public:
  Runtime()=default;
  Runtime(const Runtime&)=delete;
  Runtime& operator=(const Runtime&)=delete;
  Runtime(Runtime&&)=delete;
  Runtime& operator=(Runtime&&)=delete;
  ~Runtime(){stop();if(task!=nullptr){vTaskDelete(task);task=nullptr;output(config.left,0);output(config.right,0);}}
  bool begin(const Configuration &value) {
    // Validate the whole configuration before GPIO/PWM/task side effects.
    // A started runtime owns one task and cannot be reconfigured in place.
    stop();if(task!=nullptr||controller.fault)return false;
    if(value.driver!=Driver::DirectionEnable&&value.driver!=Driver::DualInput)return false;
    if(value.physicalStop < -1 || value.profile==nullptr)return false;
    size_t profileLength=0;
    while(profileLength<=80&&value.profile[profileLength]!='\0'){
      const char c=value.profile[profileLength];
      if(!((c>='a'&&c<='z')||(c>='A'&&c<='Z')||(c>='0'&&c<='9')||c=='-'||c=='_'||c=='.'))return false;
      ++profileLength;
    }
    if(profileLength==0||profileLength>80)return false;
    const int pins[]={value.left.first,value.left.second,value.right.first,value.right.second};
    for(int n=0;n<4;n++){if(pins[n]<0)return false;for(int m=0;m<n;m++)if(pins[n]==pins[m])return false;if(pins[n]==value.physicalStop)return false;}
    config=value;memcpy(profile,value.profile,profileLength);profile[profileLength]='\0';config.profile=profile;
    for(int pin:pins){pinMode(pin,OUTPUT);digitalWrite(pin,LOW);}
    if(config.physicalStop>=0)pinMode(config.physicalStop,config.stopActiveLow?INPUT_PULLUP:INPUT_PULLDOWN);
    if(!attach(config.left)||!attach(config.right)){controller.fail();return false;}
    snprintf(session,sizeof(session),"%08lx%08lx",(unsigned long)esp_random(),(unsigned long)esp_random());
    Serial.begin(115200);
    if(xTaskCreate(safetyTask,"jective-safety",4096,this,configMAX_PRIORITIES-2,&task)!=pdPASS){task=nullptr;controller.fail();return false;}
    initialized=true;
    Serial.printf("@JECTIVE {\"v\":1,\"type\":\"hello\",\"firmware\":\"0.1.0\",\"profile\":\"%s\",\"device\":\"%llx\",\"session\":\"%s\",\"capabilities\":[\"motor-limited\",\"heartbeat-challenge\"]}\n",config.profile,(unsigned long long)ESP.getEfuseMac(),session);
    return true;
  }
  bool armAutonomous(){if(!initialized)return false;portENTER_CRITICAL(&mux);bool ok=controller.arm(millis(),true,config.physicalStop>=0);portEXIT_CRITICAL(&mux);return ok;}
  bool drive(float left,float right,uint32_t duration){if(!initialized)return false;portENTER_CRITICAL(&mux);bool ok=controller.drive(left,right,duration,controller.sequence+1,millis());portEXIT_CRITICAL(&mux);return ok;}
  void stop(){portENTER_CRITICAL(&mux);controller.disarm();portEXIT_CRITICAL(&mux);}
  // Cooperative waits keep parser responsive; safety outputs also have their own RTOS task.
  void wait(uint32_t ms){if(!initialized)return;const uint32_t started=millis();while(uint32_t(millis()-started)<ms){poll();delay(1);}}
  void poll(){if(!initialized)return;const uint32_t now=millis();if(uint32_t(now-lastChallenge)>=100){lastChallenge=now;challenge=esp_random();challengeUnused=true;Serial.printf("@JECTIVE {\"v\":1,\"type\":\"challenge\",\"nonce\":%lu}\n",(unsigned long)challenge);}int budget=128;while(Serial.available()&&budget--){char c=Serial.read();if(c=='\n'){if(!overflow){line[length]='\0';command();}length=0;overflow=false;}else if(c!='\r'){if(length<sizeof(line)-1)line[length++]=c;else overflow=true;}}}
 private:
  Configuration config{};SafetyController controller;portMUX_TYPE mux=portMUX_INITIALIZER_UNLOCKED;TaskHandle_t task=nullptr;bool initialized=false;char profile[81]{};
  char session[17]{},line[160]{};size_t length=0;bool overflow=false,challengeUnused=false;uint32_t challenge=0,lastChallenge=0;
  bool attach(MotorPins p){if(config.driver==Driver::DirectionEnable)return ledcAttach(p.second,20000,8);return ledcAttach(p.first,20000,8)&&ledcAttach(p.second,20000,8);}
  void output(MotorPins p,float duty){const uint32_t magnitude=uint32_t(fabsf(duty)*255/100);if(config.driver==Driver::DirectionEnable){ledcWrite(p.second,0);digitalWrite(p.first,duty>0?HIGH:LOW);ledcWrite(p.second,magnitude);}else{ledcWrite(p.first,0);ledcWrite(p.second,0);if(duty>0)ledcWrite(p.first,magnitude);if(duty<0)ledcWrite(p.second,magnitude);}}
  static void safetyTask(void *argument){auto self=static_cast<Runtime*>(argument);TickType_t wake=xTaskGetTickCount();for(;;){const bool pressed=self->config.physicalStop>=0&&(digitalRead(self->config.physicalStop)==(self->config.stopActiveLow?LOW:HIGH));portENTER_CRITICAL(&self->mux);Output value=self->controller.tick(millis(),pressed);portEXIT_CRITICAL(&self->mux);self->output(self->config.left,value.left);self->output(self->config.right,value.right);vTaskDelayUntil(&wake,pdMS_TO_TICKS(10));}}
  void command(){char identity[17]{},verb[12]{},extra;unsigned long seq=0,nonce=0,duration=0;float left=0,right=0;bool accepted=false;const uint32_t now=millis();
    if(sscanf(line,"@JECTIVE1 %16s %11s %lu %lu %f %f %lu %c",identity,verb,&seq,&nonce,&left,&right,&duration,&extra)!=7||strcmp(identity,session)!=0)return;
    portENTER_CRITICAL(&mux);
    if(strcmp(verb,"stop")==0||strcmp(verb,"disarm")==0){controller.disarm();accepted=true;}
    else if(challengeUnused&&nonce==challenge&&uint32_t(now-lastChallenge)<100){
      if(strcmp(verb,"arm")==0)accepted=controller.arm(now,false,false);
      else if(strcmp(verb,"heartbeat")==0)accepted=controller.heartbeat(seq,now);
      else if(strcmp(verb,"drive")==0)accepted=controller.drive(left,right,duration,seq,now);
      if(accepted)challengeUnused=false;
    }
    portEXIT_CRITICAL(&mux);Serial.printf("@JECTIVE {\"v\":1,\"type\":\"%s\",%s}\n",accepted?"ack":"error",accepted?(String("\"seq\":")+seq+",\"commandId\":\""+String(seq)+"\"").c_str():"\"code\":\"COMMAND_REJECTED\"");
  }
};
}
