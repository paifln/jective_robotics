import {ProjectSchema,type Project} from './index';
export function createProjectCopy(value:Project,id:string):Project{const original=ProjectSchema.parse(value);if(id===original.id)throw new Error('COPY_DISTINCT_ID');return ProjectSchema.parse({...structuredClone(original),id,name:original.name.slice(0,90)+' · Copy',revision:0});}
