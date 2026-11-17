import * as Blockly from 'blockly';
import * as englishBlockly from 'blockly/msg/en';
import * as russianBlockly from 'blockly/msg/ru';
type Locale='en'|'ru'|'kk';

const kazakhBlockly = {
 ...englishBlockly,
 UNDO: 'Болдырмау',
 REDO: 'Қайталау',
 CLEAN_UP: 'Блоктарды реттеу',
 COLLAPSE_ALL: 'Барлық блокты жинау',
 EXPAND_ALL: 'Барлық блокты ашу',
 DELETE_BLOCK: 'Блокты жою',
 DELETE_X_BLOCKS: '%1 блокты жою',
 DELETE_ALL_BLOCKS: '%1 блоктың бәрі жойылсын ба?',
 DUPLICATE_BLOCK: 'Көшірмесін жасау',
 ADD_COMMENT: 'Түсініктеме қосу',
 REMOVE_COMMENT: 'Түсініктемені жою',
 DUPLICATE_COMMENT: 'Түсініктемені көшіру',
 EXTERNAL_INPUTS: 'Сыртқы кірістер',
 INLINE_INPUTS: 'Кірістерді бір жолға қою',
 EXPAND_BLOCK: 'Блокты ашу',
 COLLAPSE_BLOCK: 'Блокты жинау',
 ENABLE_BLOCK: 'Блокты қосу',
 DISABLE_BLOCK: 'Блокты өшіру',
 HELP: 'Анықтама',
};
const blocklyMessages: Record<Locale, Omit<typeof englishBlockly, 'default'>> = {
 en: englishBlockly,
 ru: russianBlockly,
 kk: kazakhBlockly,
};

export function setBlocklyLocale(locale: Locale) {
 Blockly.ContextMenu.hide();
 Blockly.setLocale(blocklyMessages[locale]);
}
const labels:Record<string,[string,string]>={
 'stop wheels':['остановить колёса','дөңгелектерді тоқтату'],
 'serial label':['подпись сообщения','хабар белгісі'],value:['значение','мән'],
 'distance valid':['расстояние доступно','қашықтық қолжетімді'],
 'Sound event':['звуковое событие','дыбыс оқиғасы'],'Stop sound event':['остановить звуковое событие','дыбыс оқиғасын тоқтату'],'Hz for':['Гц на','Гц ұзақтығы'],
 'PWM duty':['заполнение PWM','PWM толтыруы'],
 'simulation clock (s)':['часы симуляции (с)','симуляция сағаты (с)'],
 'simulation clock (ms)':['часы симуляции (мс)','симуляция сағаты (мс)'],
 'analog (counts)':['аналоговый вход (отсчёты)','аналогтық кіріс (санақ)'],'analog (V)':['аналоговый вход (В)','аналогтық кіріс (В)'],
 function:['функция','функция'],parameters:['параметры','параметрлер'],body:['тело','дене'],call:['вызвать','шақыру'],setup:['начало','бастау'],loop:['постоянный цикл','үздіксіз цикл'],indicator:['индикатор','индикатор'],channel:['канал','арна'],wait:['ждать','күту'],'wait expression':['ждать значение','мәнді күту'],s:['с','с'],ms:['мс','мс'],serial:['сообщение','хабар'],
 'wheels left':['колёса: левое','дөңгелектер: сол'],right:['правое','оң'],'% (simulation)':['% (симуляция)','% (симуляция)'],'stop wheels (simulation)':['остановить колёса (симуляция)','дөңгелектерді тоқтату (симуляция)'],repeat:['повторить','қайталау'],times:['раз','рет'],while:['пока','әзірше'],budget:['предел','шек'],iterations:['итераций','итерация'],if:['если','егер'],then:['то','онда'],otherwise:['иначе','әйтпесе'],set:['присвоить','тағайындау'],to:['значение','мән'],variable:['переменная','айнымалы'],not:['не','емес'],sensor:['датчик','сенсор'],'(simulation)':['(симуляция)','(симуляция)'],
 ON:['ВКЛ','ҚОСУЛЫ'],OFF:['ВЫКЛ','ӨШІРУЛІ'],'2 (simulation)':['2 (симуляция)','2 (симуляция)'],and:['и','және'],or:['или','немесе'],'distance (m)':['расстояние (м)','қашықтық (м)'],'line left':['линия слева','сол сызық'],'line right':['линия справа','оң сызық'],'heading (rad)':['курс (рад)','бағыт (рад)'],'x (m)':['x (м)','x (м)'],'y (m)':['y (м)','y (м)'],button:['кнопка','батырма']
};
const originalLabels=new WeakMap<Blockly.Field,string>();
const appliedLocale=new WeakMap<Blockly.Field,string>();
const originalMenus=new WeakMap<Blockly.FieldDropdown,ReturnType<Blockly.FieldDropdown['getOptions']>>();
function translate(text:string,locale:Locale){
 const argument=/^argument ([1-8])$/.exec(text);if(argument)return locale==='en'?text:(locale==='ru'?'аргумент ':'аргумент ')+argument[1];
 return locale==='en'?text:labels[text]?.[locale==='ru'?0:1]??text;
}
/** Changes presentation in place: connections, block IDs and undo history survive. */
export function localizeBlocks(workspace:Blockly.Workspace,locale:Locale,physicalMotors=false){
 Blockly.Events.disable();try{
  for(const block of workspace.getAllBlocks(false))if(block.type.startsWith('jective_'))for(const input of block.inputList)for(const field of input.fieldRow){
   const motor=physicalMotors&&(block.type==='jective_drive'||block.type==='jective_stop');
   const presentation=locale+':'+motor;
   if(appliedLocale.get(field)===presentation)continue;appliedLocale.set(field,presentation);
   if(field instanceof Blockly.FieldDropdown){
    let menu=originalMenus.get(field);if(!menu){menu=field.getOptions(false);originalMenus.set(field,menu);}
    const selected=field.getValue();field.setOptions(menu.map(option=>typeof option[0]==='string'?[translate(option[0],locale),option[1]]:option));field.setValue(selected);
   }else if(field instanceof Blockly.FieldLabel){
    let text=originalLabels.get(field);if(text===undefined){text=field.getText();originalLabels.set(field,text);}field.setValue(translate(motor?text.replace(' (simulation)',''):text,locale));
   }
  }
 }finally{Blockly.Events.enable();}
}
