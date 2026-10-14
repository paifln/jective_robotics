import type {Expression} from '../codegen';
export function evaluateExpression(expression:Expression,variable:(name:string)=>number,sensor:(name:Extract<Expression,{kind:'sensor'}>['sensor'])=>number):number{
 const evaluate=(e:Expression):number=>{
  let value:number;
  if(e.kind==='number')value=e.value;
  else if(e.kind==='variable')value=variable(e.name);
  else if(e.kind==='not')value=Number(!evaluate(e.value));
  else if(e.kind==='sensor')value=sensor(e.sensor);
  else{
   const a=evaluate(e.left);
   if(e.op==='&&'&&!a)return 0;
   if(e.op==='||'&&a)return 1;
   const b=evaluate(e.right);
   switch(e.op){
    case '+':value=a+b;break;
    case '-':value=a-b;break;
    case '*':value=a*b;break;
    case '/':if(b===0)throw new Error('DIVISION_BY_ZERO');value=a/b;break;
    case '<':value=Number(a<b);break;
    case '>':value=Number(a>b);break;
    case '==':value=Number(a===b);break;
    case '&&':value=Number(!!a&&!!b);break;
    case '||':value=Number(!!a||!!b);break;
   }
  }
  if(!Number.isFinite(value))throw new Error('EXPRESSION_RANGE');
  return value;
 };
 return evaluate(expression);
}
