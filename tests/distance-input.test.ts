import {it,expect} from 'vitest';
import {DistanceInputSchema,injectedDistance} from '../packages/simulator/distance';
import {RobotSimulation,WorldSchema,worlds,RobotStateSchema} from '../packages/simulator';
import {generate,type Program} from '../packages/codegen';
const model={initialMeters:.5,events:[{timeMs:20,meters:null},{timeMs:40,meters:3},{timeMs:60,meters:0},{timeMs:80,meters:2}]};
it('missing, out-of-range, zero and boundary values remain distinct and ordered',()=>{
 expect(injectedDistance(model,0,2)).toEqual({meters:.5,status:'valid',source:'injected'});expect(injectedDistance(model,19,2).meters).toBe(.5);expect(injectedDistance(model,20,2)).toEqual({meters:null,status:'missing',source:'injected'});expect(injectedDistance(model,40,2)).toEqual({meters:null,status:'outOfRange',source:'injected'});expect(injectedDistance(model,60,2)).toEqual({meters:0,status:'valid',source:'injected'});expect(injectedDistance(model,80,2).meters).toBe(2);expect(injectedDistance(model,120000,2).meters).toBe(2);
 expect(injectedDistance({initialMeters:null,events:[{timeMs:0,meters:1}]},0,2).meters).toBe(1);expect(injectedDistance({initialMeters:null,events:[]},0,2).status).toBe('missing');
 for(const time of [-1,.5,120001,NaN])expect(()=>injectedDistance(model,time,2)).toThrow('DISTANCE_TIME_RANGE');for(const maximum of [.1,5.1,NaN])expect(()=>injectedDistance(model,0,maximum)).toThrow('DISTANCE_MAX_RANGE');
 for(const invalid of [{initialMeters:-1,events:[]},{initialMeters:Infinity,events:[]},{initialMeters:0,events:[{timeMs:20,meters:1},{timeMs:20,meters:2}]},{initialMeters:0,events:[{timeMs:40,meters:1},{timeMs:20,meters:2}]},{initialMeters:0,events:[{timeMs:120000,meters:1}]}])expect(DistanceInputSchema.safeParse(invalid).success).toBe(false);
 expect(WorldSchema.safeParse({...worlds[0]!,distanceInput:model}).success).toBe(true);
 const state=new RobotSimulation({setup:[],loop:[]},worlds[0]!).state;
 expect(RobotStateSchema.safeParse({...state,distance:null,distanceStatus:'valid'}).success).toBe(false);expect(RobotStateSchema.safeParse({...state,distance:0,distanceStatus:'missing'}).success).toBe(false);
});
it('programs must check validity before reading a missing measurement instead of substituting zero',()=>{
 const program:Program={setup:[{kind:'repeat',count:5,body:[{kind:'if',condition:{kind:'sensor',sensor:'distanceValid'},then:[{kind:'set',name:'last_valid_m',value:{kind:'sensor',sensor:'distance'}},{kind:'print',text:'VALID'}],otherwise:[{kind:'print',text:'INVALID'}]},{kind:'wait',ms:20}]}],loop:[]};
 const scenario={...worlds[0]!,distanceInput:structuredClone(model)};
 const simulation=new RobotSimulation(program,scenario);scenario.distanceInput.events[0]!.meters=1;
 const states=Array.from({length:6},()=>simulation.step());expect(states[0]!.distance).toBeNull();expect(states[0]!.distanceStatus).toBe('missing');expect(states[1]!.distanceStatus).toBe('outOfRange');expect(states[2]!.distance).toBe(0);expect(states.at(-1)!.variables.last_valid_m).toBe(2);expect(states.at(-1)!.log).toEqual(['0 ms: VALID','20 ms: INVALID','40 ms: INVALID','60 ms: VALID','80 ms: VALID']);expect(states.at(-1)!.status).toBe('completed');for(const state of states)expect(RobotStateSchema.safeParse(state).success).toBe(true);
 const unsafe:Program={setup:[{kind:'set',name:'distance',value:{kind:'sensor',sensor:'distance'}},{kind:'print',text:'UNREACHABLE'}],loop:[]};for(const initialMeters of [null,3]){const failed=new RobotSimulation(unsafe,{...worlds[0]!,distanceInput:{initialMeters,events:[]}}).step();expect(failed.status).toBe('error');expect(failed.error).toContain('DISTANCE_READING_INVALID');expect(failed.distance).toBeNull();expect(failed.variables.distance).toBeUndefined();expect(failed.log).toEqual([]);expect(failed.left).toBe(0);}
 expect(()=>generate(program,2)).toThrow('SENSOR_DRIVER_REQUIRED');
 const shortCircuit:Program={setup:[{kind:'if',condition:{kind:'binary',op:'&&',left:{kind:'sensor',sensor:'distanceValid'},right:{kind:'binary',op:'<',left:{kind:'sensor',sensor:'distance'},right:{kind:'number',value:.5}}},then:[{kind:'print',text:'NEAR'}],otherwise:[{kind:'print',text:'NO_VALID_NEAR_READING'}]}],loop:[]};expect(new RobotSimulation(shortCircuit,{...worlds[0]!,distanceInput:{initialMeters:null,events:[]}}).step().log).toEqual(['0 ms: NO_VALID_NEAR_READING']);
});
