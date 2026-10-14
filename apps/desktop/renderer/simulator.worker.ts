import {interpretFunctions} from '../../../packages/simulator/functions';
import type {FunctionProgram} from '../../../packages/codegen/functions';
import {interpret} from '../../../packages/simulator';
import type {Program} from '../../../packages/codegen';
self.onmessage=(event:MessageEvent<{operationId:string;program:Program|FunctionProgram}>)=>{
 try{self.postMessage({operationId:event.data.operationId,ok:true,trace:('functions' in event.data.program?interpretFunctions(event.data.program,10000):interpret(event.data.program,10000))});}catch(e){self.postMessage({operationId:event.data.operationId,ok:false,error:String(e)});}
};
