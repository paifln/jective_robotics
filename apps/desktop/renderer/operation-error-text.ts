import type {Locale} from './locale';

const integrity:Record<Locale,string>={
 en:'The build tools did not pass the integrity check. Upload is blocked. Compile again. If the error repeats, ask a teacher to check the build tools.',
 ru:'Не удалось подтвердить целостность инструментов сборки. Загрузка на плату заблокирована. Повтори сборку. Если ошибка повторяется, попроси учителя проверить инструменты сборки.',
 kk:'Құрастыру құралдарының тұтастығын тексеру сәтсіз аяқталды. Тақшаға жүктеу бұғатталды. Кодты қайта құрастыр. Қате қайталанса, мұғалімнен құрастыру құралдарын тексеруді сұра.'
};
/** Keep the diagnostic code while giving learners a concrete recovery step. */
const journal:Record<string,Record<Locale,string>>={
 PROJECT_CONFLICT:{en:'This file changed outside the current project. Saving was stopped to protect it. Keep your current work in a project copy before reopening the file.',ru:'Файл изменён вне текущего проекта. Сохранение остановлено, чтобы не затереть изменения. Сохрани свою работу в копии проекта перед повторным открытием файла.',kk:'Файл ағымдағы жобадан тыс өзгертілді. Өзгерістерді өшірмеу үшін сақтау тоқтатылды. Файлды қайта ашпас бұрын жұмысыңды жоба көшірмесінде сақта.'},
 WORKSPACE_BUSY:{en:'Another workspace action is still running. Wait for it to finish or close its dialog, then try again.',ru:'Другая операция ещё выполняется. Дождись её завершения или закрой окно выбора файла, затем повтори попытку.',kk:'Басқа әрекет әлі орындалып жатыр. Оның аяқталуын күт немесе файл таңдау терезесін жап, содан кейін қайталап көр.'},
 PROJECT_BUSY:{en:'A project is being opened or saved. Finish that action before trying again.',ru:'Проект открывается или сохраняется. Заверши это действие и повтори попытку.',kk:'Жоба ашылып немесе сақталып жатыр. Осы әрекетті аяқтап, қайталап көр.'},
 TOOLCHAIN_BUSY:{en:'The build tools are busy. Wait for the current build or upload to finish, or stop it first.',ru:'Инструменты сборки заняты. Дождись завершения сборки или загрузки на плату либо сначала останови её.',kk:'Құрастыру құралдары бос емес. Құрастырудың немесе тақшаға жүктеудің аяқталуын күт немесе алдымен оны тоқтат.'},
 SAVE_CANCELLED:{en:'Saving was cancelled. Your current program is still open.',ru:'Сохранение отменено. Текущая программа остаётся открытой.',kk:'Сақтау тоқтатылды. Ағымдағы бағдарлама ашық қалды.'},
 BACKUP_TOO_LARGE:{en:'This backup exceeds the 64 MiB limit. Choose a smaller JECTIVE workspace backup.',ru:'Резервная копия превышает лимит 64 МиБ. Выбери меньшую копию рабочей области JECTIVE.',kk:'Сақтық көшірме 64 МиБ шегінен асады. JECTIVE жұмыс аймағының кішірек көшірмесін таңда.'},
 PROCESS_LOG_UNAVAILABLE:{en:'This journal is unavailable in the current session. Compile your project again to create a new journal.',ru:'Этот журнал недоступен в текущем сеансе. Скомпилируй свой проект снова, чтобы создать новый журнал.',kk:'Бұл журнал ағымдағы сеанста қолжетімсіз. Жаңа журнал жасау үшін өз жобаңызды қайта құрастырыңыз.'},
 PROCESS_LOG_UNSAFE:{en:'The journal could not be opened safely. Ask a teacher to check the local build files.',ru:'Не удалось безопасно открыть журнал. Попроси учителя проверить локальные файлы сборки.',kk:'Журналды қауіпсіз ашу мүмкін болмады. Мұғалімнен жергілікті құрастыру файлдарын тексеруді сұраңыз.'},
 PROCESS_LOG_LIMIT:{en:'The operation stopped because its output exceeded the 64 MiB journal limit. Ask a teacher to investigate the repeated messages before trying again.',ru:'Операция остановлена: вывод превысил лимит журнала 64 МиБ. Перед повторной попыткой попроси учителя проверить повторяющиеся сообщения.',kk:'Операция тоқтатылды: шығыс журналдың 64 МиБ шегінен асты. Қайталаудан бұрын мұғалімнен қайталанған хабарларды тексеруді сұраңыз.'}
};
export function operationErrorText(error:{code:string;message:string},locale:Locale):string{
 if(error.code==='BUILD_ENVIRONMENT_CHANGED')return integrity[locale]+'\n\n'+error.code;
 if(Object.hasOwn(journal,error.code))return journal[error.code]![locale]+'\n\n'+error.code;
 return error.code===error.message?error.code:error.code+'\n'+error.message;
}
