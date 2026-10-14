import {ProjectSchema,type Project} from '../contracts';
export function createCodeCopy(original:Project,id:string):Project{
 const parsed=ProjectSchema.parse(original);if(parsed.mode!=='blocks')throw new Error('CONVERSION_REQUIRES_BLOCKS');if(id===parsed.id)throw new Error('CONVERSION_DISTINCT_ID');
 return ProjectSchema.parse({...structuredClone(parsed),id,name:parsed.name.slice(0,90)+' · Code',mode:'code',revision:0});
}
