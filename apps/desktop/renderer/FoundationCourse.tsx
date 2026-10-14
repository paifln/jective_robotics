import {ComponentPhoto} from './ComponentPhoto';
import {ReadingTools} from './ReadingTools';
import {FoundationVisual} from './FoundationVisual';
import React,{useState,useRef} from 'react';
import {foundationLessons} from '../../../packages/content/foundations';
import {LearningExercise} from './LearningExercise';
import type {Locale} from './locale';
import {words} from './StudentUI';
import {HardwareTour} from './HardwareTour';
export function FoundationCourse({locale}:{locale:Locale}){
 const [selected,setSelected]=useState('F01');const article=useRef<HTMLElement>(null),heading=useRef<HTMLHeadingElement>(null);const choose=(id:string)=>{setSelected(id);requestAnimationFrame(()=>{heading.current?.focus({preventScroll:true});article.current?.scrollIntoView({block:'start'});});};const lesson=foundationLessons.find(l=>l.id===selected)!;const w=(en:string,ru:string,kk:string)=>words(locale,en,ru,kk);
 return <div className="library-layout"><aside>{foundationLessons.map((l,i)=><button key={l.id} aria-pressed={selected===l.id} onClick={()=>choose(l.id)}><small>{i+1} · {l.minutes} {w('min','мин','мин')}</small><span>{l.title[locale]}</span></button>)}</aside><article ref={article}><div className="lesson-heading"><h3 ref={heading} tabIndex={-1}>{lesson.title[locale]}</h3><ReadingTools id={lesson.id} locale={locale}/></div><p className="lesson-badge">{w('Start without a board or code','Начни без платы и кода','Тақша мен кодсыз баста')}</p><p>{lesson.goal[locale]}</p>{(selected==='F03'||selected==='F04')&&<HardwareTour id="L01" locale={locale}/>}<FoundationVisual lesson={lesson} locale={locale}/><ComponentPhoto id={lesson.id} locale={locale}/>{lesson.sections.map((s,i)=><section key={i}><h4>{s.title[locale]}</h4>{s.body[locale].split('\n\n').map((p,j)=><p key={j}>{p}</p>)}</section>)}<section><h4>{w('Example','Пример','Мысал')}</h4><p>{lesson.example[locale]}</p></section><LearningExercise key={lesson.id} activity={lesson.activity} locale={locale}/><section><h4>{w('Your next experiment','Твой следующий опыт','Келесі тәжірибең')}</h4><p>{lesson.challenge[locale]}</p></section><div className="toolbar"><button disabled={selected==='F01'} onClick={()=>choose(foundationLessons[foundationLessons.indexOf(lesson)-1]!.id)}>{w('Previous','Назад','Артқа')}</button><button disabled={selected==='F08'} onClick={()=>choose(foundationLessons[foundationLessons.indexOf(lesson)+1]!.id)}>{w('Next lesson','Следующий урок','Келесі сабақ')}</button></div></article></div>;
}
