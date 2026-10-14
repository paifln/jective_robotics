type Locale='en'|'ru'|'kk';
const copy:Record<string,[string,string]>={
 'Keep editing':['Продолжить работу','Жұмысты жалғастыру'],
 'Discard unsaved changes and close':['Закрыть без сохранения','Сақтамай жабу'],
 'Unsaved project':['Проект не сохранён','Жоба сақталмаған'],
 'The project has unsaved changes.':['В проекте есть изменения. Сохрани их перед закрытием.','Жобада өзгерістер бар. Жаппас бұрын сақта.'],
 Cancel:['Отмена','Бас тарту'],
 Copy:['Копия','Көшірме'],
 'Upload selected firmware':['Загрузить программу','Бағдарламаны жүктеу'],
 'Restore backup':['Восстановить копию','Көшірмені қалпына келтіру'],
 'Replace local workspace records? A backup of the current database will be retained.':['Заменить сохранённые проекты данными из резервной копии? Текущая база будет сохранена отдельно.','Сақталған жобаларды сақтық көшірмемен ауыстыру керек пе? Ағымдағы база бөлек сақталады.'],
 'Delete project and its snapshots?':['Удалить проект и его сохранённые версии?','Жобаны және сақталған нұсқаларын жою керек пе?'],
 Delete:['Удалить','Жою'],
 'Delete local project and snapshots':['Удалить проект и версии','Жоба мен нұсқаларын жою'],
 'Delete local recovery and snapshots for this project? Exported files are not removed.':['Удалить проект и сохранённые версии с этого компьютера? Отдельные экспортированные файлы останутся.','Жоба мен сақталған нұсқаларды осы компьютерден жою керек пе? Бөлек экспортталған файлдар сақталады.'],
};
export function nativeText(value:string,locale:Locale){
 if(locale==='en')return value;
 const upload=/^Upload to (.+)\? Verify the physical board model, wiring and power\. Upload does not verify safe physical behavior\.$/.exec(value);
 if(upload)return locale==='ru'?`Загрузить программу на ${upload[1]}? Проверь, что выбрана твоя плата ESP32, провода подключены правильно и питание подходит. Загрузка заменит программу на плате.`:`Бағдарламаны ${upload[1]} портына жүктеу керек пе? Өз ESP32 тақшаңды, сымдар мен қуатты тексер. Жүктеу тақшадағы бағдарламаны ауыстырады.`;
 return copy[value]?.[locale==='ru'?0:1]??value;
}
