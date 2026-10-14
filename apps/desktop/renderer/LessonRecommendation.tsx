import React,{useEffect,useState} from 'react';
import {recommendLesson} from '../../../packages/content/lesson-recommendation';
import {lessons} from '../../../packages/content/lessons';
import {words} from './StudentUI';
import type {Locale} from './locale';
export function LessonRecommendation({locale,revision,select}:{locale:Locale;revision:number;select:(id:string)=>void}){
 const [id,setId]=useState<string|null>(null),[ready,setReady]=useState(false);
 useEffect(()=>{let current=true;setReady(false);void window.jective.workspace().then(result=>{if(!current)return;if(result.ok){setId(recommendLesson(lessons,result.value.progress)?.id??null);setReady(true);}}).catch(()=>{});return()=>{current=false;};},[revision]);
 if(!ready||!id)return null;const lesson=lessons.find(lesson=>lesson.id===id)!;
 return <div className="lesson-recommendation"><button onClick={()=>select(id)}>{words(locale,'Suggested next lesson','Рекомендуемый следующий урок','Ұсынылатын келесі сабақ')}: {id} · {lesson.title[locale]}</button><small>{words(locale,'Based on saved knowledge checks. You can open any lesson.','По сохранённым проверкам знаний. Можно открыть любой урок.','Сақталған білім тексерулеріне негізделген. Кез келген сабақты аша аласыз.')}</small></div>;
}
