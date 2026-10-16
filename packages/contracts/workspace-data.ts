/** Limits serialized editor data before recursion in Blockly or JSON.stringify. */
export const workspaceDataLimits={depth:1024,nodes:100000,characters:4000000} as const;
export function safeWorkspaceData(value:unknown):value is Record<string,unknown>{
 if(!value||typeof value!=='object'||Array.isArray(value))return false;
 const stack:{value:unknown;depth:number;exit?:boolean}[]=[{value,depth:0}],ancestors=new WeakSet<object>();let nodes=1,characters=0;
 while(stack.length){
  const entry=stack.pop()!,item=entry.value;
  if(entry.depth>workspaceDataLimits.depth)return false;
  if(item===null||item===undefined||typeof item==='boolean')continue;
  if(typeof item==='string'){characters+=item.length;if(characters>workspaceDataLimits.characters)return false;continue;}
  if(typeof item==='number'){if(!Number.isFinite(item))return false;continue;}
  if(typeof item!=='object')return false;
  if(entry.exit){ancestors.delete(item);continue;}
  if(ancestors.has(item))return false;
  const array=Array.isArray(item),prototype=Object.getPrototypeOf(item);
  if(array?item.length>workspaceDataLimits.nodes||prototype!==Array.prototype:prototype!==Object.prototype&&prototype!==null)return false;
  if(Object.getOwnPropertySymbols(item).length)return false;
  ancestors.add(item);stack.push({value:item,depth:entry.depth,exit:true});
  for(const key in item){
   if(!Object.hasOwn(item,key))continue;
   if(['__proto__','prototype','constructor'].includes(key))return false;
   const descriptor=Object.getOwnPropertyDescriptor(item,key)!;
   if(!('value'in descriptor))return false;
   characters+=key.length;if(characters>workspaceDataLimits.characters||++nodes>workspaceDataLimits.nodes)return false;
   stack.push({value:descriptor.value,depth:entry.depth+1});
  }
 }
 return true;
}
