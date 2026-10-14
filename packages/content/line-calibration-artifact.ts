import type {LessonArtifact} from './index';
import type {Instruction,Program} from '../codegen';
import {WorldSchema} from '../simulator';
const reading=(sensor:'lineLeft'|'lineRight',name:string):Instruction=>({kind:'set',name,value:{kind:'sensor',sensor}});
function sampleProgram(both:boolean):Program{return {setup:[{kind:'repeat',count:50,body:[reading('lineLeft','left_reflectance'),{kind:'printValue',label:'left=',value:{kind:'variable',name:'left_reflectance'}},...(both?[reading('lineRight','right_reflectance'),{kind:'printValue' as const,label:'right=',value:{kind:'variable' as const,name:'right_reflectance'}}]:[]),{kind:'drive',left:20,right:20},{kind:'wait',ms:20}]},{kind:'stop'},{kind:'wait',ms:200}],loop:[]};}
export const lineCalibrationArtifact:LessonArtifact={
 starter:sampleProgram(false),reference:sampleProgram(true),
 world:WorldSchema.parse({id:'L27-cross-line',width:2,height:2,start:{x:.5,y:1,heading:0},goal:{x:1.5,y:1.5,radius:.1},obstacles:[],line:[{x:.65,y:.5},{x:.65,y:1.5}],robot:{track:.18,maxSpeed:.6,acceleration:1.25,radius:.12}})
};
