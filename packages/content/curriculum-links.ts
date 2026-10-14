type LessonLink={id:string;prerequisites:readonly string[]};
type GuideLink={id:string;lessons:readonly string[]};
/** Structural checks only; a valid dependency graph is not pedagogical acceptance. */
export function curriculumLinkErrors(lessons:readonly LessonLink[],guides:readonly GuideLink[]):string[]{
 const errors:string[]=[],nodes=new Map<string,LessonLink>();
 for(const lesson of lessons){if(nodes.has(lesson.id))errors.push(lesson.id+': DUPLICATE_LESSON_ID');else nodes.set(lesson.id,lesson);}
 const degree=new Map<string,number>(),dependents=new Map<string,string[]>();
 for(const lesson of nodes.values()){
  const seen=new Set<string>();let count=0;
  for(const prerequisite of lesson.prerequisites){
   if(seen.has(prerequisite)){errors.push(lesson.id+': DUPLICATE_PREREQUISITE '+prerequisite);continue;}seen.add(prerequisite);
   if(!nodes.has(prerequisite)){errors.push(lesson.id+': MISSING_PREREQUISITE '+prerequisite);continue;}
   if(prerequisite===lesson.id)errors.push(lesson.id+': SELF_PREREQUISITE');
   count++;const children=dependents.get(prerequisite)??[];children.push(lesson.id);dependents.set(prerequisite,children);
  }
  degree.set(lesson.id,count);
 }
 const queue=[...degree].filter(([,count])=>count===0).map(([id])=>id);
 for(let index=0;index<queue.length;index++)for(const child of dependents.get(queue[index]!)??[]){const remaining=degree.get(child)!-1;degree.set(child,remaining);if(remaining===0)queue.push(child);}
 if(queue.length!==nodes.size)errors.push('CURRICULUM_CYCLE: prerequisite graph cannot be ordered');
 const guideIds=new Set<string>();
 for(const guide of guides){
  if(guideIds.has(guide.id))errors.push(guide.id+': DUPLICATE_GUIDE_ID');guideIds.add(guide.id);
  const seen=new Set<string>();
  for(const lesson of guide.lessons){if(seen.has(lesson))errors.push(guide.id+': DUPLICATE_GUIDE_LESSON '+lesson);seen.add(lesson);if(!nodes.has(lesson))errors.push(guide.id+': MISSING_GUIDE_LESSON '+lesson);}
 }
 return errors;
}
