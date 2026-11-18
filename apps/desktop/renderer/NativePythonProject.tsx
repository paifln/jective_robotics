import React,{useState} from 'react';
import {ProjectSchema,type Project} from '../../../packages/contracts';
import type {PythonRequest} from '../../../packages/robots/python-runtime';
import type {Locale} from './locale';
import {words} from './StudentUI';

export function NativePythonFiles({project,activeFile,select,locale,change}:{
 project:Project; activeFile:string; select:(file:string)=>void; locale:Locale; change:(project:Project)=>void;
}){
 const [name,setName]=useState('');
 const [error,setError]=useState(false);
 const w=(en:string,ru:string,kk:string)=>words(locale,en,ru,kk);
 const files=project.pythonFiles??{};
 const add=(event:React.FormEvent)=>{
  event.preventDefault();
  const text=name.trim();
  const filename=text.endsWith('.py')?text:text+'.py';
  const next=ProjectSchema.safeParse({...project,pythonFiles:{...files,[filename]:''}});
  if(!next.success||Object.hasOwn(files,filename)){setError(true);return;}
  change(next.data);select(filename);setName('');setError(false);
 };
 const remove=()=>{
  if(!confirm(w('Remove '+activeFile+'?','Удалить '+activeFile+'?',activeFile+' жойылсын ба?')))return;
  const remaining={...files};
  delete remaining[activeFile];
  change({...project,pythonFiles:remaining});select('main.py');
 };
 return <div className="code-files native-python-files">
  <div role="tablist" aria-label={w('Python files','Файлы Python','Python файлдары')}>
   {['main.py',...Object.keys(files)].map(file=><button key={file} role="tab" aria-selected={activeFile===file} onClick={()=>select(file)}>{file}</button>)}
  </div>
  <form onSubmit={add}>
   <input value={name} onChange={event=>setName(event.target.value)} aria-label={w('Module name','Имя модуля','Модуль атауы')} placeholder="helper.py"/>
   <button disabled={!name.trim()}>{w('Add module','Добавить модуль','Модуль қосу')}</button>
   {activeFile!=='main.py'&&<button type="button" onClick={remove}>{w('Remove file','Удалить файл','Файлды жою')}</button>}
  </form>
  {error&&<p role="alert">{w('Choose a unique Python module name.','Введи уникальное имя Python-модуля латиницей.','Python модуліне латын әріптерімен бірегей атау енгіз.')}</p>}
  <details>
   <summary>{w('Simulator commands','Команды симулятора','Симулятор пәрмендері')}</summary>
   <p><code>from jective_robot import forward, right, stop, wait_ms</code></p>
   <p><code>forward()</code> · <code>backward()</code> · <code>left()</code> · <code>right()</code> · <code>drive(50, 50)</code> · <code>stop()</code> · <code>wait_ms(500)</code></p>
   <p><code>distance()</code> · <code>line_left()</code> · <code>line_right()</code> · <code>button()</code> · <code>led(True)</code></p>
  </details>
  <p className="note">{project.pythonTarget==='uno'
   ?w('Python 3 on this computer. Install the Uno controller once and use pyserial for USB control.',
      'Python 3 работает на компьютере. Для управления по USB установи pyserial и один раз прошей контроллер Uno.',
      'Python 3 компьютерде жұмыс істейді. USB басқару үшін pyserial орнатып, Uno контроллерін бір рет жүкте.')
   :w('Connect the ESP32 over USB to run or save the program on the board.',
      'Подключи ESP32 по USB, чтобы запустить или сохранить программу на плате.',
      'Бағдарламаны тақшада іске қосу немесе сақтау үшін ESP32-ні USB арқылы қос.')}</p>
 </div>;
}

export function PythonRuntimeActions({target,locale,busy,running,port,run,stop,installUno}:{
 target:PythonRequest['target']; locale:Locale; busy:boolean; running:boolean; port:string;
 run:(action:PythonRequest['action'],usePort:boolean)=>void; stop:()=>void; installUno:()=>void;
}){
 const w=(en:string,ru:string,kk:string)=>words(locale,en,ru,kk);
 return <section className="python-device-actions" aria-label={w('Python actions','Действия Python','Python әрекеттері')}>
  <div className="python-action-row">
   {target==='uno'
    ?<button className="primary" disabled={busy} onClick={()=>run('run',!!port)}>{port
     ?w('Run Python with Arduino Uno','Запустить на Uno','Uno тақшасында іске қосу')
     :w('Run Python on computer','Запустить на компьютере','Компьютерде іске қосу')}</button>
    :<button className="primary" disabled={busy||!port} onClick={()=>{
     if(confirm(w('Run on ESP32 now? Matching modules on the board will be updated.','Запустить на ESP32? Одноимённые модули на плате будут обновлены.','ESP32-де іске қосылсын ба? Аттас модульдер жаңартылады.')))run('run',true);
    }}>{w('Run on ESP32 with output','Запустить на ESP32','ESP32-де іске қосу')}</button>}
   <button disabled={busy} onClick={()=>run('check',false)}>{w('Check Python syntax','Проверить код','Кодты тексеру')}</button>
   {target==='esp32'&&<button disabled={busy||!port} onClick={()=>{
    if(confirm(w('Replace main.py and matching modules on the ESP32?','Заменить main.py и одноимённые модули на ESP32?','ESP32 тақшасындағы main.py мен аттас модульдер ауыстырылсын ба?')))run('deploy',true);
   }}>{w('Upload to ESP32 and restart','Сохранить на ESP32','ESP32-ге сақтау')}</button>}
   {running&&<button className="wireless-stop" onClick={stop}>{w('Cancel Python operation','Отменить','Болдырмау')}</button>}
   {target==='esp32'&&!running&&port&&<button disabled={busy} onClick={()=>run('stop-board',true)}>{w('Interrupt ESP32','Остановить ESP32','ESP32-ні тоқтату')}</button>}
   <details className="python-board-setup">
    <summary>{w('Board setup','Настройка платы','Тақша баптауы')}</summary>
    {target==='uno'
     ?<button disabled={busy||!port} onClick={installUno}>{w('Install Uno controller','Установить прошивку Uno','Uno микробағдарламасын орнату')}</button>
     :<>
      <p>{w('Use a classic ESP32 with at least 4 MB of flash and select its USB port.', 'Для установки выбери USB-порт классической ESP32 с памятью от 4 МБ.', 'Орнату үшін кемінде 4 МБ жады бар классикалық ESP32 тақшасының USB портын таңда.')}</p>
      <div className="python-action-row">
       <button disabled={busy||!port} onClick={()=>run('probe',true)}>{w('Check MicroPython on board','Проверить MicroPython','MicroPython-ды тексеру')}</button>
       <button disabled={busy||!port} onClick={()=>{
        if(confirm(w('Install MicroPython on '+port+'? This erases the existing firmware and files on the selected ESP32.',
         'Установить MicroPython на '+port+'? Прошивка и файлы на выбранной ESP32 будут удалены.',
         port+' портына MicroPython орнатылсын ба? Таңдалған ESP32 тақшасының микробағдарламасы мен файлдары өшіріледі.')))run('install',true);
       }}>{w('Install MicroPython','Установить MicroPython','MicroPython орнату')}</button>
      </div>
     </>}
   </details>
  </div>
  {target==='esp32'&&!port&&<p className="note">{w('Select the ESP32 USB port to use the board.', 'Выбери USB-порт ESP32 для работы с платой.', 'Тақшамен жұмыс істеу үшін ESP32 USB портын таңда.')}</p>}
 </section>;

}

export function PythonConsoleInput({locale,send}:{locale:Locale;send:(line:string)=>Promise<boolean>}){
 const [line,setLine]=useState('');
 const [error,setError]=useState(false);
 const w=(en:string,ru:string,kk:string)=>words(locale,en,ru,kk);
 return <form onSubmit={event=>{
  event.preventDefault();
  void send(line).then(sent=>{setError(!sent);if(sent)setLine('');},()=>setError(true));
 }}>
  <input value={line} maxLength={4096} aria-label={w('Python console input','Ввод для Python','Python енгізу жолы')} onChange={event=>setLine(event.target.value)}/>
  <button>{w('Send input','Отправить ввод','Енгізуді жіберу')}</button>
  {error&&<p role="alert">{w('The Python console is unavailable.','Консоль Python недоступна.','Python консолі қолжетімсіз.')}</p>}
 </form>;
}
