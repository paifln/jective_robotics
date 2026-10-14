import type {LessonArtifact} from './index';
import type {Program,Instruction,Expression} from '../codegen';
import {WorldSchema} from '../simulator';
const n=(value:number):Expression=>({kind:'number',value});
const v=(name:string):Expression=>({kind:'variable',name});
const binary=(op:'<'|'>'|'=='|'&&'|'||',left:Expression,right:Expression):Expression=>({kind:'binary',op,left,right});
const branch=(condition:Expression,then:Instruction[],otherwise:Instruction[]=[]):Instruction=>({kind:'if',condition,then,otherwise});
const state=(value:number):Instruction=>({kind:'set',name:'line_state',value:n(value)});
/** States: centered 0, left 1, right 2, lost 3, fault 4. */
export function lineFollowingProgram(stopOnLoss=true):Program{
 const leftDark=binary('==',v('left_sample'),n(0)),rightDark=binary('==',v('right_sample'),n(0));
 const lost=stopOnLoss?3:0;
 const decision=branch(leftDark,[branch(rightDark,[state(0)],[state(1)])],[branch(rightDark,[state(2)],[state(lost)])]);
 const stop:Expression={kind:'sensor',sensor:'button'};
 const output=branch(binary('==',v('line_state'),n(0)),[{kind:'drive',left:20,right:20}],[branch(binary('==',v('line_state'),n(1)),[{kind:'drive',left:10,right:20}],[branch(binary('==',v('line_state'),n(2)),[{kind:'drive',left:20,right:10}],[{kind:'stop'}])])]);
 return {setup:[state(0),{kind:'repeat',count:400,body:[{kind:'set',name:'left_sample',value:{kind:'sensor',sensor:'lineLeft'}},{kind:'set',name:'right_sample',value:{kind:'sensor',sensor:'lineRight'}},branch(stop,[state(4)],[branch(binary('<',v('line_state'),n(3)),[decision])]),output,{kind:'wait',ms:20}]},{kind:'stop'},{kind:'wait',ms:200}],loop:[]};
}
export const lineFollowingArtifact:LessonArtifact={starter:lineFollowingProgram(false),reference:lineFollowingProgram(),world:WorldSchema.parse({id:'L28-two-sensor-line',width:2,height:2,start:{x:.5,y:1,heading:0},goal:{x:1.5,y:1.5,radius:.1},obstacles:[],line:[{x:.4,y:1},{x:1.2,y:1}],robot:{probeForward:.08,probeSeparation:.02,track:.18,maxSpeed:.6,acceleration:1.25,radius:.12}})};
