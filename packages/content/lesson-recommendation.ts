import {curriculumLinkErrors} from './curriculum-links';
/** Quiz evidence guides navigation; it does not certify practical or physical mastery. */
export function recommendLesson<T extends {id:string;prerequisites:readonly string[]}>(lessons:readonly T[],progress:Readonly<Record<string,string>>):T|null{
 if(curriculumLinkErrors(lessons,[]).length)return null;
 const passed=(id:string)=>Object.hasOwn(progress,id)&&progress[id]==='knowledge-check-passed';
 return lessons.find(lesson=>!passed(lesson.id)&&lesson.prerequisites.every(passed))??null;
}
