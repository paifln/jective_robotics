import {instructions} from './policy.mjs';

/** Fixed destination: neither a learner nor request context selects an upstream URL/model. */
export async function askProvider({providerKey,model,input,signal,fetchImpl}){
 const upstream=await fetchImpl('https://api.openai.com/v1/chat/completions',{
  method:'POST',redirect:'error',signal,headers:{'Content-Type':'application/json',Authorization:'Bearer '+providerKey},
  body:JSON.stringify({model,max_completion_tokens:1600,messages:[{role:'system',content:instructions},...input.history,{role:'user',content:input.question+'\n\nBEGIN OPTIONAL PROJECT CONTEXT\n'+input.context+'\nEND PROJECT CONTEXT'}]})
 });
 if(!upstream.ok){await upstream.body?.cancel();return {status:upstream.status===429?429:502};}
 if(!upstream.body)throw new Error('No response');
 const reader=upstream.body.getReader(),parts=[];let bytes=0;
 try{
  for(;;){const next=await reader.read();if(next.done)break;bytes+=next.value.length;if(bytes>256000)throw new Error('Oversized response');parts.push(next.value);}
 }catch(error){await reader.cancel().catch(()=>{});throw error;}finally{reader.releaseLock();}
 const data=JSON.parse(Buffer.concat(parts).toString('utf8')),choice=data?.choices?.[0];
 if(typeof choice?.message?.content!=='string'||!choice.message.content.trim()||choice.message.content.length>32000)throw new Error('Invalid response');
 const finish=['stop','length','content_filter'].includes(choice.finish_reason)?choice.finish_reason:'stop';
 return {status:200,value:{choices:[{message:{content:choice.message.content},finish_reason:finish}]}};
}
