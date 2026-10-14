import {buildErrorCases} from './build-error-cases';
import {multiFileArtifact} from './multifile-lesson';
import type {SourceFiles} from '../contracts/source-files';
import {functionsInterfaceArtifact} from './functions-interface';
import {nonblockingArtifact} from './nonblocking-time';
import {collectionsArtifact} from './collections-telemetry';
import {typesScopeArtifact} from './types-scope';
/** Code-only tasks have no fictitious Blockly workspace or block simulator claim. */
export const codeLessonArtifacts:Record<string,{starter:string;reference:string;starterFiles?:SourceFiles;referenceFiles?:SourceFiles}>={L38:typesScopeArtifact,L39:functionsInterfaceArtifact,L40:nonblockingArtifact,L41:collectionsArtifact,L42:multiFileArtifact};
/** Multi-case compiler lessons launch explicitly selected source/profile pairs. */
export const codeLessonInvestigations:Record<string,typeof buildErrorCases>={L50:buildErrorCases};
