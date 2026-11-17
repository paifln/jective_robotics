import React from 'react';
import type {Project} from '../../../packages/contracts';
import {PythonSyntaxError, pythonSketch} from '../../../packages/codegen/python';
import {words} from './StudentUI';

export function PythonProjectFiles({project, activeFile, select, locale}:{
 project:Project;
 activeFile:string;
 select:(file:string)=>void;
 locale:'en'|'ru'|'kk';
}) {
 let error = '';
 if (!project.source) {
  try {
   pythonSketch(project);
  } catch (cause) {
   error = cause instanceof PythonSyntaxError
    ? words(locale, 'Check Python syntax on line', 'Проверь синтаксис Python в строке', 'Python синтаксисін мына жолда тексер') + ' ' + cause.line
    : String(cause);
  }
 }
 return <>
  <div className="code-file-tabs">
   <button aria-pressed={activeFile==='main.py'} onClick={()=>select('main.py')}>main.py</button>
   <button aria-pressed={activeFile==='sketch.ino'} onClick={()=>select('sketch.ino')} disabled={!project.source}>
    {words(locale,'Generated Arduino C++','Сгенерированный Arduino C++','Жасалған Arduino C++')}
   </button>
  </div>
  {error && <p role="alert">{error}</p>}
  <details>
   <summary>{words(locale,'Supported Python commands','Поддерживаемые команды Python','Қолдау көрсетілетін Python командалары')}</summary>
   <p>{words(locale,
    'Write commands inside setup() (once) or loop() (repeatedly). Use four spaces per indentation level.',
    'Пиши команды внутри setup() (один раз) или loop() (повторяется). Делай отступы по четыре пробела.',
    'Командаларды setup() (бір рет) немесе loop() (қайталанады) ішінде жаз. Әр шегініске төрт бос орын қолдан.')}</p>
   <p><code>led(True)</code> · <code>led(False)</code> · <code>wait_ms(500)</code> · <code>drive(35, 35)</code> · <code>stop()</code> · <code>for _ in range(3):</code> · <code>pass</code></p>
  </details>
 </>;
}
