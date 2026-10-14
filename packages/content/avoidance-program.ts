import type {Program,Instruction,Expression} from '../codegen';
const n=(value:number):Expression=>({kind:'number',value});
const v=(name:string):Expression=>({kind:'variable',name});
const clock:Expression={kind:'sensor',sensor:'timeMs'};
const compare=(op:'>'|'==',left:Expression,right:Expression):Expression=>({kind:'binary',op,left,right});
const set=(name:string,value:Expression):Instruction=>({kind:'set',name,value});
const branch=(condition:Expression,then:Instruction[],otherwise:Instruction[]=[]):Instruction=>({kind:'if',condition,then,otherwise});
const enter=(state:number):Instruction[]=>[set('avoid_state',n(state)),set('entered_ms',clock)];
/** Numeric states: move=0 stop=1 inspect=2 turn=3 retry=4 blocked=5 fault=6. */
export function avoidanceProgram(turnMs=1180):Program{
 if(!Number.isInteger(turnMs)||turnMs<400||turnMs>1600||turnMs%20!==0)throw new Error('AVOIDANCE_TURN_CONFIG');
 const clear=compare('>',{kind:'sensor',sensor:'distance'},n(.3));
 const elapsed:Expression={kind:'binary',op:'-',left:clock,right:v('entered_ms')};
 const state=(value:number)=>compare('==',v('avoid_state'),n(value));
 const retry=branch(state(4),[branch(clear,enter(0),enter(1))]);
 const turn=branch(state(3),[branch(compare('>',elapsed,n(turnMs-1)),enter(4))],[retry]);
 const inspect=branch(state(2),[branch(compare('>',elapsed,n(99)),[branch(clear,enter(4),[branch(compare('>',v('attempts'),n(1)),enter(5),[set('attempts',{kind:'binary',op:'+',left:v('attempts'),right:n(1)}),...enter(3)])])])],[turn]);
 const stop=branch(state(1),[branch(compare('>',elapsed,n(99)),enter(2))],[inspect]);
 const move=branch(state(0),[branch(clear,[],enter(1))],[stop]);
 const stopRequested:Expression={kind:'binary',op:'||',left:compare('>',clock,n(3799)),right:{kind:'sensor',sensor:'button'}};
 const transition=branch(stopRequested,enter(6),[branch({kind:'sensor',sensor:'distanceValid'},[move],enter(6))]);
 const output=branch(state(0),[{kind:'drive',left:20,right:20}],[branch(state(3),[{kind:'drive',left:-20,right:20}],[{kind:'stop'}])]);
 return {setup:[set('avoid_state',n(0)),set('entered_ms',n(0)),set('attempts',n(0)),{kind:'repeat',count:200,body:[transition,output,{kind:'wait',ms:20}]},{kind:'stop'},{kind:'wait',ms:200}],loop:[]};
}
