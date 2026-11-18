import type {Project} from '../contracts';
import {updatePythonSketch} from './python';
import {pythonSimulationStarter} from '../robots/python-simulation';

export type StudioLanguage='blocks'|'cpp'|'python';

export function studioLanguage(project:Project):StudioLanguage{
 return project.pythonSource!==undefined?'python':project.mode==='blocks'?'blocks':'cpp';
}

export function switchStudioLanguage(project:Project,language:StudioLanguage,blocksSource:string):Project{
 const current=studioLanguage(project);
 if(current===language)return project;
 const arduinoDraft=current==='cpp'?{source:project.source,files:project.sourceFiles}:project.arduinoDraft;
 const pythonDraft=project.pythonSource!==undefined
  ?{source:project.pythonSource,target:project.pythonTarget,files:project.pythonFiles}
  :project.pythonDraft;
 if(language==='python'){
  const draft=pythonDraft??{
   source:pythonSimulationStarter,
   target:project.profileId==='arduino-uno'?'uno' as const:'esp32' as const,
  };
  return updatePythonSketch({...project,mode:'code',source:'',sourceFiles:undefined,arduinoDraft,
   pythonSource:draft.source,pythonTarget:draft.target,pythonFiles:draft.files,pythonDraft:undefined});
 }
 return {...project,mode:language==='blocks'?'blocks':'code',
  source:language==='blocks'?blocksSource:arduinoDraft?.source??blocksSource,
  sourceFiles:language==='cpp'?arduinoDraft?.files:undefined,
  arduinoDraft:language==='cpp'?undefined:arduinoDraft,
  pythonSource:undefined,pythonTarget:undefined,pythonFiles:undefined,pythonDraft};
}
