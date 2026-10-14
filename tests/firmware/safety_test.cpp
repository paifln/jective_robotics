#include "../../firmware/jective-runtime/SafetyController.h"
#include <assert.h>
#include <stdio.h>
using namespace jective;
int main(){
 SafetyController c;assert(!c.tick(0,false).armed);assert(!c.drive(10,10,100,1,0));assert(!c.arm(0,true,false));
 assert(c.arm(0,false,false));assert(!c.drive(NAN,10,100,1,0));assert(!c.drive(31,10,100,1,0));assert(!c.drive(10,10,2001,1,0));
 assert(c.drive(20,20,1000,1,0));assert(!c.drive(20,20,1000,1,0));auto first=c.tick(10,false);assert(first.left>0&&first.left<=.401f);assert(c.tick(399,false).armed);assert(!c.tick(400,false).armed);assert(c.left==0&&c.right==0);
 assert(c.arm(1000,false,false));assert(c.heartbeat(1,1200));assert(!c.heartbeat(1,1500));assert(c.tick(1599,false).armed);assert(!c.tick(1600,false).armed);
 assert(c.arm(0xffffff00u,false,false));assert(c.heartbeat(1,0xfffffff0u));assert(c.tick(0x17fu,false).armed);assert(!c.tick(0x180u,false).armed);
 assert(c.arm(0,true,true));assert(c.drive(20,20,2000,1,0));for(uint32_t t=10;t<=500;t+=10)c.tick(t,false);assert(c.left>19);assert(c.drive(-20,-20,1000,2,500));assert(c.tick(510,false).left==0);assert(c.tick(550,false).left==0);assert(c.tick(560,false).left<0);assert(!c.tick(570,true).armed);
 assert(c.arm(0,true,true));assert(c.drive(10,10,100,1,0));c.tick(10,false);for(uint32_t t=20;t<=200;t+=10)c.tick(t,false);assert(c.left==0&&c.right==0);c.fail();assert(!c.arm(0,false,false));assert(!c.tick(200,false).armed);
 puts("PASS: startup, invalid speed/duration, duplicate sequence, heartbeat expiry, rollover, acceleration, reversal dwell, physical stop logic, bounded motion and latched fault.");
}
