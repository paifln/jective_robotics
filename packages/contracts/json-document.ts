/** Reject invalid UTF-8 rather than silently changing a learner's stored text. */
export function parseJsonDocument(bytes:Uint8Array,errorCode:string):unknown{
 try{return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}
 catch{throw new Error(errorCode);}
}
