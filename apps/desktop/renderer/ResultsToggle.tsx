import React from 'react';
import type {Locale} from './locale';
import {words} from './StudentUI';
export function ResultsToggle({locale,collapsed,toggle}:{locale:Locale;collapsed:boolean;toggle:()=>void}){
 const label=collapsed?words(locale,'Expand results','Развернуть результаты','Нәтижелерді ашу'):words(locale,'Collapse results','Свернуть результаты','Нәтижелерді жинау');
 return <button className="results-toggle" aria-label={label} title={label} aria-expanded={!collapsed} onClick={toggle}><svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d={collapsed?'m6 9 6 6 6-6':'m6 15 6-6 6 6'} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg></button>;
}
