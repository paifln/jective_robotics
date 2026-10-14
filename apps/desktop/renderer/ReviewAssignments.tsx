import React from 'react';
import type {Assignment} from '../../../packages/contracts';
import type {Locale} from './locale';
import {words} from './StudentUI';
export function ReviewAssignments({assignments,locale,busy,inspect}:{assignments:Assignment[];locale:Locale;busy:boolean;inspect:(assignment:Assignment)=>void}){const w=(en:string,ru:string,kk:string)=>words(locale,en,ru,kk);if(!assignments.length)return null;return <details className="review-assignments"><summary>{w('Saved assignments','Сохранённые задания','Сақталған тапсырмалар')}</summary>{assignments.map(assignment=><article key={assignment.id}><strong>{assignment.title}</strong>{assignment.dueDate&&<p>{assignment.dueDate}</p>}<button disabled={busy} onClick={()=>inspect(assignment)}>{w('Inspect assignment','Просмотреть задание','Тапсырманы қарау')}</button></article>)}</details>;}
