import type {Project} from '../contracts';
export interface SourceDiagnostic {file:string;line:number;column:number;kind:'error'|'warning'|'note'|'fatal error';message:string}
/** Only project files become navigation targets; toolchain paths remain raw log text. */
export function compilerDiagnostics(log:string,project:Project,operationId?:string):SourceDiagnostic[]{
 if(operationId!==undefined&&!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(operationId))return [];
 const names=new Map(['sketch.ino',...Object.keys(project.sourceFiles??{})].map(name=>[name.toLowerCase(),name]));const diagnostics:SourceDiagnostic[]=[];
 for(const match of log.slice(-1000000).matchAll(/(?:^|[\r\n])([^\r\n]+?):([1-9]\d{0,5}):([1-9]\d{0,5}):\s*(error|warning|note|fatal error):\s*([^\r\n]+)/g)){
  const path=match[1]!.trim().replaceAll('\\','/').toLowerCase(),basename=path.split('/').at(-1)!,file=names.get(basename);if(!file)continue;
  if(operationId!==undefined&&(path.split('/').includes('..')||!path.endsWith('/builds/'+operationId.toLowerCase()+'/sketch/'+basename)))continue;
  diagnostics.push({file,line:Number(match[2]),column:Number(match[3]),kind:match[4] as SourceDiagnostic['kind'],message:match[5]!.slice(0,4000)});if(diagnostics.length===30)break;
 }
 return diagnostics;
}
