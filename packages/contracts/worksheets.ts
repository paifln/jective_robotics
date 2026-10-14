import {z} from 'zod';
import {RoverInspectionSchema} from '../content/rover-inspection';
export const componentWorksheet={id:'L02-component-role-and-power-path',roles:['controller','carrier','driver','actuator','sensor','supply'],fields:['marking','observed','documented','source','unknown','signalPath','powerPath','connectionDecision','reason']} as const;
const keys=new Set(componentWorksheet.roles.flatMap(role=>componentWorksheet.fields.map(field=>role+'.'+field)));
export const WorksheetValuesSchema=z.record(z.string().refine(key=>keys.has(key),'Unknown worksheet field'),z.string().max(2000)).refine(values=>Object.keys(values).length<=54);
export const ProjectWorksheetsSchema=z.object({'L02-component-role-and-power-path':WorksheetValuesSchema.optional(),'L19-rover-inspection':RoverInspectionSchema.optional()}).strict();
