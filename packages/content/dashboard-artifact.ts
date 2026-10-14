import type {Program,Instruction} from '../codegen';
import type {LessonArtifact} from './index';
import {worlds} from '../simulator';
const sensor=(name:'timeMs'|'analogVolts'|'distanceValid'|'distance')=>({kind:'sensor' as const,sensor:name});
const read:Instruction={kind:'set',name:'dashboard_distance_m',value:sensor('distance')};
const make=(guarded:boolean):Program=>({setup:[{kind:'repeat',count:10,body:[
 {kind:'set',name:'dashboard_time_ms',value:sensor('timeMs')},
 {kind:'set',name:'dashboard_analog_v',value:sensor('analogVolts')},
 {kind:'set',name:'dashboard_distance_valid',value:sensor('distanceValid')},
 ...(guarded?[{kind:'if' as const,condition:{kind:'variable' as const,name:'dashboard_distance_valid'},then:[read,{kind:'printValue' as const,label:'distance_m=',value:{kind:'variable' as const,name:'dashboard_distance_m'}}],otherwise:[{kind:'print' as const,text:'distance_m: INVALID; no measurement'}]}]:[read,{kind:'printValue' as const,label:'distance_m=',value:{kind:'variable' as const,name:'dashboard_distance_m'}}]),
 {kind:'printValue',label:'analog_V=',value:{kind:'variable',name:'dashboard_analog_v'}},
 {kind:'printValue',label:'time_ms=',value:{kind:'variable',name:'dashboard_time_ms'}},
 {kind:'set',name:'dashboard_commit',value:{kind:'binary',op:'+',left:{kind:'variable',name:'dashboard_time_ms'},right:{kind:'number',value:1}}},
 {kind:'wait',ms:200}
 ]}],loop:[]});
export const dashboardArtifact:LessonArtifact={starter:make(false),reference:make(true),world:{...worlds[0]!,id:'L18-two-input-dashboard',analog:{referenceVolts:3.3,bits:12,inputVolts:1,noiseVolts:0,seed:18,events:[{timeMs:1000,inputVolts:2}]},distanceInput:{initialMeters:.5,events:[{timeMs:400,meters:null},{timeMs:1000,meters:1.2}]}}};
