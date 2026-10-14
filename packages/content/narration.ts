import {foundationLessons} from './foundations';
import {lessons} from './lessons';
/** Source text for offline recordings. Assessment answers and private learner records are excluded. */
export function narrationTexts(){
 return [...foundationLessons.flatMap(lesson=>(['en','ru'] as const).map(locale=>({id:lesson.id,locale,text:[lesson.title[locale],lesson.goal[locale],...lesson.sections.flatMap(s=>[s.title[locale],s.body[locale]]),lesson.example[locale]].join('\n\n')}))),...lessons.flatMap(lesson=>(['en','ru'] as const).map(locale=>({id:lesson.id,locale,text:lesson.title[locale]+'\n\n'+lesson.explanation[locale]})))];
}
