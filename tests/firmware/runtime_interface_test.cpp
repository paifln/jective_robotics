#include "CheckedMove.h"
#include <cassert>
#include <limits>
#include <type_traits>
using namespace jective;
Configuration configuration(){return {Driver::DirectionEnable,{1,2},{3,4},5,true,"host-fixture"};}
void assertNoEffects(){assert(host::pinModes==0);assert(host::writes==0);assert(host::attachments==0);assert(host::tasks==0);assert(host::serialCalls==0);}
int main(){
 static_assert(!std::is_copy_constructible<Runtime>::value);static_assert(!std::is_move_constructible<Runtime>::value);static_assert(!std::is_copy_assignable<Runtime>::value);static_assert(!std::is_move_assignable<Runtime>::value);
 host::reset();{Runtime scoped;assert(scoped.begin(configuration()));assert(scoped.armAutonomous());assert(scoped.drive(10,10,100));host::pwm[2]=200;host::pwm[4]=200;assert(host::deletedTasks==0);}assert(host::deletedTasks==1);assert(host::pwm[2]==0&&host::pwm[4]==0);
 host::reset();Runtime uninitialized;assert(!uninitialized.armAutonomous());assert(!uninitialized.drive(10,10,100));uninitialized.poll();uninitialized.wait(10);assert(host::now==0);assertNoEffects();assert(checkedMove(uninitialized,10,10,100)==MoveResult::RuntimeRejected);assertNoEffects();
 // Full configuration validation must precede the first hardware-bound call.
 for(int variant=0;variant<9;variant++){
  host::reset();Runtime robot;auto config=configuration();std::string longProfile(81,'a');
  if(variant==0)config.right.second=config.left.first;
  if(variant==1)config.right.second=-1;
  if(variant==2)config.physicalStop=config.right.second;
  if(variant==3)config.physicalStop=-2;
  if(variant==4)config.driver=static_cast<Driver>(99);
  if(variant==5)config.profile=nullptr;
  if(variant==6)config.profile="";
  if(variant==7)config.profile="unsafe\"profile";
  if(variant==8)config.profile=longProfile.c_str();
  assert(!robot.begin(config));assert(!robot.armAutonomous());assert(!robot.drive(10,10,100));robot.poll();assertNoEffects();
 }
 // Each partial attach failure latches a fault; retry cannot falsely report ready.
 for(int failure=1;failure<=4;failure++){
  host::reset();host::failAttachment=failure;Runtime robot;auto config=configuration();config.driver=Driver::DualInput;
  assert(!robot.begin(config));assert(host::attachments==failure);assert(host::tasks==0);assert(!robot.armAutonomous());assert(!robot.drive(10,10,100));const int attempts=host::attachments;host::failAttachment=0;assert(!robot.begin(config));assert(host::attachments==attempts);
 }
 host::reset();{host::taskSucceeds=false;Runtime taskFailure;assert(!taskFailure.begin(configuration()));assert(host::tasks==1);assert(!taskFailure.armAutonomous());assert(!taskFailure.drive(10,10,100));host::taskSucceeds=true;assert(!taskFailure.begin(configuration()));assert(host::tasks==1);}assert(host::deletedTasks==0); // A failed creation returned no valid task ownership.
 host::reset();Runtime withoutStop;auto noStop=configuration();noStop.physicalStop=-1;assert(withoutStop.begin(noStop));assert(!withoutStop.armAutonomous());assert(checkedMove(withoutStop,10,10,100)==MoveResult::RuntimeRejected);
 host::reset();Runtime robot;char ownedProfile[]="host-fixture";auto config=configuration();config.profile=ownedProfile;assert(robot.begin(config));assert(host::tasks==1);ownedProfile[0]='X';assert(config.profile[0]=='X');assert(std::string(host::profilePointer)=="host-fixture"); // Runtime owns its original profile name.
 assert(robot.armAutonomous());assert(checkedMove(robot,-30,30,1)==MoveResult::Accepted);assert(checkedMove(robot,0,0,2000)==MoveResult::Accepted);
 const int modes=host::pinModes,attached=host::attachments;assert(!robot.begin(configuration()));assert(host::tasks==1);assert(host::pinModes==modes);assert(host::attachments==attached);assert(checkedMove(robot,10,10,100)==MoveResult::RuntimeRejected); // Re-begin disarmed the old controller.
 const float nan=std::numeric_limits<float>::quiet_NaN(),inf=std::numeric_limits<float>::infinity();
 const float badSpeeds[]={-30.01f,30.01f,nan,inf,-inf};
 for(float speed:badSpeeds){assert(robot.armAutonomous());assert(checkedMove(robot,speed,10,100)==MoveResult::InvalidInput);assert(robot.drive(10,10,100)==false);assert(robot.armAutonomous());assert(checkedMove(robot,10,speed,100)==MoveResult::InvalidInput);assert(robot.drive(10,10,100)==false);}
 for(int64_t duration:{int64_t(-1),int64_t(0),int64_t(2001),std::numeric_limits<int64_t>::max()}){assert(robot.armAutonomous());assert(checkedMove(robot,10,10,duration)==MoveResult::InvalidInput);assert(!robot.drive(10,10,100));}
 // API acceptance means internal command admission only. No host RTOS task ran.
 assert(host::serialLog.find("host-fixture")!=std::string::npos);
 // Curated learner cases: observed results from the real API, not a JS model.
 struct Case {const char* id;float left,right;int64_t duration;bool ready,armed;MoveResult expected;};
 const Case cases[]={{"valid",10,10,100,true,true,MoveResult::Accepted},{"speed-limit",30,-30,2000,true,true,MoveResult::Accepted},{"too-fast",31,10,100,true,true,MoveResult::InvalidInput},{"zero-duration",10,10,0,true,true,MoveResult::InvalidInput},{"negative-duration",10,10,-1,true,true,MoveResult::InvalidInput},{"too-long",10,10,2001,true,true,MoveResult::InvalidInput},{"not-ready",10,10,100,false,false,MoveResult::RuntimeRejected},{"not-armed",10,10,100,true,false,MoveResult::RuntimeRejected}};
 std::printf("[");bool first=true;
 for(const auto &item:cases){host::reset();Runtime tested;if(item.ready)assert(tested.begin(configuration()));if(item.armed)assert(tested.armAutonomous());const auto result=checkedMove(tested,item.left,item.right,item.duration);assert(result==item.expected);if(result!=MoveResult::Accepted)assert(!tested.drive(10,10,100));std::printf("%s{\"id\":\"%s\",\"left\":%.0f,\"right\":%.0f,\"durationMs\":%lld,\"ready\":%s,\"armed\":%s,\"result\":\"%s\"}",first?"":",",item.id,item.left,item.right,(long long)item.duration,item.ready?"true":"false",item.armed?"true":"false",result==MoveResult::Accepted?"Accepted":result==MoveResult::InvalidInput?"InvalidInput":"RuntimeRejected");first=false;}
 std::printf("]\n");
 return 0;
}
