import {expect,it} from 'vitest';
import * as Blockly from 'blockly';
import {programWorkspace,toFunctionProgram} from '../apps/desktop/renderer/blocks';
import {arduinoUnoBlocksProgram} from '../packages/robots/arduino-uno';
import {compileArduinoWireless,WirelessCompileError} from '../packages/codegen/arduino-wireless';
import type {Expression,Instruction} from '../packages/codegen';
import type {FunctionProgram} from '../packages/codegen/functions';
import {WirelessProgramSchema,WirelessStateSchema,wirelessProgramChecksum,type WirelessProgram} from '../packages/contracts/arduino-wireless';

const num=(value:number):Expression=>({kind:'number',value});
const stop:Instruction={kind:'stop'};
const compile=(setup:Instruction[],loop:Instruction[]=[])=>compileArduinoWireless({setup,loop});

it('compiles the real Blockly Uno starter into bounded commands without changing its source workspace',()=>{
 const workspace=new Blockly.Workspace();
 try{
  Blockly.serialization.workspaces.load(programWorkspace(arduinoUnoBlocksProgram),workspace);
  const before=Blockly.serialization.workspaces.save(workspace);
  expect(compileArduinoWireless(toFunctionProgram(workspace))).toEqual({version:1,loopStart:-1,steps:[{op:'w',a:1000,b:0},{op:'m',a:89,b:89},{op:'w',a:500,b:0},{op:'s',a:0,b:0}]});
  expect(Blockly.serialization.workspaces.save(workspace)).toEqual(before);
 }finally{workspace.dispose();}
});

it('preserves setup-once and loop-repeated boundaries, motor signs and constant waits',()=>{
 const program=compile([{kind:'led',on:true},{kind:'repeat',count:2,body:[{kind:'drive',left:-100,right:0.5},stop]}],[{kind:'waitValue',value:num(1)},{kind:'led',on:false}]);
 expect(program.loopStart).toBe(5);expect(program.steps).toEqual([{op:'l',a:1,b:0},{op:'m',a:-255,b:1},{op:'s',a:0,b:0},{op:'m',a:-255,b:1},{op:'s',a:0,b:0},{op:'w',a:1,b:0},{op:'l',a:0,b:0}]);
 expect(compile([],[stop]).loopStart).toBe(0);
 expect(compile([stop],[{kind:'repeat',count:0,body:[stop]}]).loopStart).toBe(-1);
});

it('inlines constant function parameters and evaluates constant branches with short circuit semantics',()=>{
 const program:FunctionProgram={setup:[{kind:'call',name:'pause',arguments:[num(10)]},{kind:'call',name:'pause',arguments:[num(25)]}],loop:[],functions:[{name:'pause',parameters:['time'],body:[{kind:'if',condition:{kind:'binary',op:'||',left:num(1),right:{kind:'binary',op:'/',left:num(1),right:num(0)}},then:[{kind:'waitValue',value:{kind:'binary',op:'*',left:{kind:'variable',name:'time'},right:num(2)}}],otherwise:[{kind:'drive',left:100,right:100}]}]}]};
 expect(compileArduinoWireless(program).steps).toEqual([{op:'w',a:20,b:0},{op:'w',a:50,b:0}]);
});

it('rejects unsupported blocks and expressions with their originating block ID, even in unused branches',()=>{
 const unsupported:Instruction[]=[{kind:'set',name:'x',value:num(1)},{kind:'while',condition:num(0),maxIterations:1,body:[]},{kind:'print',text:'x'},{kind:'pwm',value:num(20)},{kind:'sound',frequencyHz:440,durationMs:100}];
 for(const instruction of unsupported){
  let error:unknown;try{compile([{...instruction,blockId:'unsupported-block'}]);}catch(value){error=value;}
  expect(error).toBeInstanceOf(WirelessCompileError);expect(error).toMatchObject({code:'WIRELESS_UNSUPPORTED_BLOCK',blockId:'unsupported-block',instructionKind:instruction.kind});
 }
 expect(()=>compile([{kind:'waitValue',value:{kind:'variable',name:'x'},blockId:'dynamic'}])).toThrow('WIRELESS_DYNAMIC_EXPRESSION: waitValue: dynamic');
 expect(()=>compile([{kind:'if',condition:num(0),then:[{kind:'waitValue',value:{kind:'sensor',sensor:'timeMs'},blockId:'sensor'}],otherwise:[stop]}])).toThrow('WIRELESS_UNSUPPORTED_SENSOR: waitValue: sensor');
 expect(()=>compile([{kind:'led',on:true,channel:2,blockId:'second-led'}])).toThrow('WIRELESS_SECOND_INDICATOR: led: second-led');
});

it('rejects empty, oversized and exponentially expanding programs before transmission',()=>{
 expect(()=>compile([])).toThrow('WIRELESS_EMPTY_PROGRAM');
 expect(compile([{kind:'repeat',count:96,body:[stop]}]).steps).toHaveLength(96);
 expect(()=>compile([{kind:'repeat',count:97,body:[{...stop,blockId:'too-many'}]}])).toThrow('WIRELESS_PROGRAM_LIMIT: stop: too-many');
 expect(()=>compile([stop,{kind:'repeat',count:1000,body:[{kind:'repeat',count:1000,body:[]}]}])).toThrow('WIRELESS_EXPANSION_LIMIT');
 expect(()=>compile([{kind:'waitValue',value:num(60000.1),blockId:'too-long'}])).toThrow('WIRELESS_WAIT_RANGE: waitValue: too-long');
 expect(()=>compile([{kind:'waitValue',value:num(1.9),blockId:'fractional'}])).toThrow('WIRELESS_WAIT_RANGE: waitValue: fractional');
 expect(()=>compile([{kind:'waitValue',value:{kind:'binary',op:'/',left:num(1),right:num(0)},blockId:'divide'}])).toThrow('WIRELESS_EXPRESSION_RANGE: waitValue: divide');
 expect(()=>compile([{kind:'drive',left:101,right:0}])).toThrow('MOTOR_RANGE');
});

it('folds constants with Uno float32 precision and rejects nonfinite AVR intermediates',()=>{
 const condition:Expression={kind:'binary',op:'==',left:{kind:'binary',op:'+',left:num(16777216),right:num(1)},right:num(16777216)};
 expect(compile([{kind:'if',condition,then:[stop],otherwise:[{kind:'drive',left:100,right:100}]}]).steps).toEqual([{op:'s',a:0,b:0}]);
 expect(()=>compile([{kind:'waitValue',value:{kind:'binary',op:'*',left:num(1e30),right:num(1e30)},blockId:'overflow'}])).toThrow('WIRELESS_EXPRESSION_RANGE: waitValue: overflow');
});

it('uses the agreed little-endian signed CRC vector and covers loop index and every instruction field',()=>{
 const vector:WirelessProgram={version:1,loopStart:1,steps:[{op:'m',a:-255,b:255},{op:'w',a:60000,b:0},{op:'l',a:1,b:0},{op:'s',a:0,b:0}]};
 // Independent fixture bytes: 040001006d01ffffffff0000007760ea0000000000006c0100000000000000730000000000000000.
 expect(wirelessProgramChecksum(vector)).toBe(63613);
 expect(wirelessProgramChecksum({...vector,loopStart:-1})).not.toBe(63613);
 expect(wirelessProgramChecksum({...vector,steps:[{op:'m',a:255,b:-255},...vector.steps.slice(1)]})).not.toBe(63613);
 expect(wirelessProgramChecksum({...vector,steps:[...vector.steps.slice(0,3),{op:'w',a:0,b:0}]})).not.toBe(63613);
});

it('validates all wire operands, command count, loop boundaries and IPC progress',()=>{
 const valid=compile([stop]);expect(WirelessProgramSchema.parse(valid)).toEqual(valid);
 for(const program of [{...valid,version:2},{...valid,loopStart:1},{...valid,loopStart:-2},{...valid,steps:[]},{...valid,extra:true},{...valid,steps:[{op:'m',a:256,b:0}]},{...valid,steps:[{op:'w',a:60001,b:0}]},{...valid,steps:[{op:'w',a:1.1,b:0}]},{...valid,steps:[{op:'s',a:1,b:0}]},{...valid,steps:[{op:'l',a:2,b:0}]},{...valid,steps:[{op:'w',a:1,b:1}]}])expect(WirelessProgramSchema.safeParse(program).success).toBe(false);
 expect(WirelessStateSchema.safeParse({status:'uploading',sent:3,total:2}).success).toBe(false);
});
