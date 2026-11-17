import {execFile} from 'node:child_process';

type SerialPortInfo={pnpId?:string;friendlyName?:string;vendorId?:string;productId?:string};
export type PortIdentity={transport:'usb'|'bluetooth'|'unknown';friendlyName?:string;bluetoothName?:string;bluetoothDirection?:'incoming'|'outgoing'|'unknown'};
export type BluetoothNameLookup=(address:string)=>Promise<string|undefined>;

export function parseBluetoothFriendlyName(output:string):string|undefined{
 const names=new Set(output.split(/\r?\n/).flatMap(line=>{
  const value=/^\s*FriendlyName\s+REG_SZ\s+(.+?)\s*$/i.exec(line)?.[1];
  return value&&value.length<=200&&!/[\x00-\x1f\x7f]/.test(value)?[value]:[];
 }));
 return names.size===1?[...names][0]:undefined;
}

export function createBluetoothNameLookup(query:BluetoothNameLookup,now:()=>number=Date.now):BluetoothNameLookup{
 const cache=new Map<string,{expiresAt:number;result:Promise<string|undefined>}>();
 return address=>{
  if(!/^[\da-f]{12}$/i.test(address)||/^0{12}$/.test(address))return Promise.resolve(undefined);
  const key=address.toUpperCase();const timestamp=now();
  for(const [cachedKey,entry] of cache)if(entry.expiresAt<=timestamp)cache.delete(cachedKey);
  const cached=cache.get(key);if(cached)return cached.result;
  if(cache.size>=64)cache.delete(cache.keys().next().value!);
  const entry={expiresAt:timestamp+30_000,result:Promise.resolve(undefined) as Promise<string|undefined>};
  entry.result=Promise.resolve().then(()=>query(key)).catch(()=>undefined).then(name=>{
   if(cache.get(key)===entry){if(name)entry.expiresAt=now()+30_000;else cache.delete(key);}
   return name;
  });
  cache.set(key,entry);return entry.result;
 };
}

const lookupWindowsBluetoothName=createBluetoothNameLookup(address=>new Promise(resolve=>{
 execFile('reg.exe',['query',`HKLM\\SYSTEM\\CurrentControlSet\\Enum\\BTHENUM\\DEV_${address}`,'/s','/v','FriendlyName'],
  {encoding:'utf8',timeout:1500,maxBuffer:64*1024,windowsHide:true,shell:false},
  (error,stdout)=>resolve(error?undefined:parseBluetoothFriendlyName(stdout)));
}));

export async function identifySerialPort(port:SerialPortInfo,options:{platform?:NodeJS.Platform;lookupBluetoothName?:BluetoothNameLookup}={}):Promise<PortIdentity>{
 const friendlyName=port.friendlyName?{friendlyName:port.friendlyName}:{};
 if(!/^BTHENUM\\/i.test(port.pnpId??''))return {...friendlyName,transport:/^USB\\/i.test(port.pnpId??'')||Boolean(port.vendorId&&port.productId)?'usb':'unknown'};
 const identity:PortIdentity={...friendlyName,transport:'bluetooth',bluetoothDirection:'unknown'};
 const address=/&([\da-f]{12})_(C[\da-f]{8}|[\da-f]{8})$/i.exec(port.pnpId!);
 if(!address)return identity;
 if(address[1]==='000000000000'&&address[2]!.length===8){identity.bluetoothDirection='incoming';return identity;}
 if(address[1]==='000000000000'||!/^C[\da-f]{8}$/i.test(address[2]!))return identity;
 identity.bluetoothDirection='outgoing';
 if((options.platform??process.platform)==='win32'){
  const name=await (options.lookupBluetoothName??lookupWindowsBluetoothName)(address[1]!.toUpperCase()).catch(()=>undefined);
  if(name)identity.bluetoothName=name;
 }
 return identity;
}
