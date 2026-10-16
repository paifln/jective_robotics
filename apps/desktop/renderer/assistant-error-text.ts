import type {Locale} from './locale';
type Copy=Record<Locale,string>;
const text=(en:string,ru:string,kk:string):Copy=>({en,ru,kk});
const unavailable=text(
 'Online help is unavailable. Try again, or use the local hints and documentation.',
 'Онлайн-помощь недоступна. Повтори попытку или используй локальные подсказки и документацию.',
 'Онлайн көмек қолжетімсіз. Қайталап көріңіз немесе жергілікті кеңестер мен құжаттаманы пайдаланыңыз.'
);
const settings=text(
 'Ask your teacher to check the assistant connection. The offline reference remains available.',
 'Попроси учителя проверить подключение помощника. Справка без интернета доступна.',
 'Мұғалімнен көмекші қосылымын тексеруді сұра. Желісіз анықтама қолжетімді.'
);
const messages:Record<string,Copy>={
 AI_INVALID_LEARNER_TOKEN:settings,
 AI_CREDENTIAL_CONTEXT_CHANGED:settings,
 AI_CREDENTIAL_REPROVISION_REQUIRED:text('Ask your teacher to renew this app’s assistant access after the security update. Local lessons and hints still work.','После обновления безопасности попроси учителя заново подключить помощника на этом компьютере. Локальные уроки и подсказки продолжают работать.','Қауіпсіздік жаңартуынан кейін мұғалімнен осы компьютердегі көмекшіні қайта қосуды сұра. Жергілікті сабақтар мен кеңестер жұмыс істейді.'),
 AI_MANAGED_CONFIGURATION_REQUIRED:settings,
 AI_ACCESS_UNAVAILABLE:text('Your assistant access has expired or is unavailable. Ask your teacher to restore it. The offline reference still works.','Доступ к помощнику истёк или недоступен. Попроси учителя восстановить его. Справка без интернета продолжает работать.','Көмекшіге қолжетімділік мерзімі аяқталған немесе қолжетімсіз. Мұғалімнен қалпына келтіруді сұра. Желісіз анықтама жұмыс істейді.'),
 AI_SERVICE_UNAVAILABLE:text('The assistant service is unavailable. Try later or ask your teacher to check the connection.','Сервис помощника недоступен. Попробуй позже или попроси учителя проверить подключение.','Көмекші қызметі қолжетімсіз. Кейінірек көр немесе мұғалімнен қосылымды тексеруді сұра.'),
 AI_QUESTION_TOO_LARGE:text('The question and conversation are too long to send. Start a new conversation or share a smaller section of code.','Вопрос и история слишком длинные для отправки. Начни новый диалог или отправь меньший фрагмент кода.','Сұрақ пен әңгіме жіберу үшін тым ұзын. Жаңа әңгіме баста немесе кодтың шағын бөлігін жібер.'),
 AI_DISABLED:text('Online help is not enabled. Use the offline reference or ask your teacher to connect the assistant.','Онлайн-помощник не подключён. Открой справку без интернета или попроси учителя подключить помощника.','Онлайн көмекші қосылмаған. Желісіз анықтаманы аш немесе мұғалімнен көмекшіні қосуды сұра.'),
 AI_BUSY:text('Another question is still being processed. Wait for its answer or cancel that request.','Другой вопрос ещё обрабатывается. Дождись ответа или отмени тот запрос.','Басқа сұрақ әлі өңделуде. Жауабын күтіңіз немесе сол сұрауды тоқтатыңыз.'),
 AI_INTERRUPTED_OR_TIMEOUT:text('The request was cancelled or took too long. You can try again; your program was not changed by the request.','Запрос отменён или превысил время ожидания. Можно повторить попытку; запрос не изменил твою программу.','Сұрау тоқтатылды немесе күту уақыты аяқталды. Қайталап көруге болады; сұрау бағдарламаңызды өзгертпеді.'),
 AI_RESPONSE_TOO_LARGE:text('The answer exceeded the application limit. Try a shorter, more specific question.','Ответ превысил лимит приложения. Попробуй задать более короткий и конкретный вопрос.','Жауап қолданба шегінен асты. Қысқарақ әрі нақтырақ сұрақ қойып көріңіз.'),
 AI_EMPTY_RESPONSE:text('The service returned no answer. Try again or use the local documentation.','Сервис не вернул ответ. Повтори попытку или используй локальную документацию.','Қызмет жауап қайтармады. Қайталап көріңіз немесе жергілікті құжаттаманы пайдаланыңыз.'),
 AI_RESPONSE_TRUNCATED:text('The answer stopped at the response limit. Ask a narrower question; an incomplete answer was not offered for code review.','Ответ остановился на лимите. Задай более узкий вопрос; незавершённый ответ не предложен для проверки кода.','Жауап шекте тоқтады. Нақтырақ сұрақ қойыңыз; аяқталмаған жауап кодты тексеруге ұсынылмады.'),
 AI_CONFIG_INVALID:settings,
 AI_SECURE_STORAGE_UNAVAILABLE:settings,
 AI_ENDPOINT_INVALID:settings,
 AI_ENDPOINT_REQUIRES_HTTPS_OR_LOCALHOST:settings,
 AI_PROVIDER_HTTP_400:settings,
 AI_PROVIDER_HTTP_401:text('The service did not accept the API key. Ask your administrator to check it in Help; local hints still work.','Сервис не принял API-ключ. Попроси администратора проверить его в разделе «Помощь»; локальные подсказки продолжают работать.','Қызмет API кілтін қабылдамады. Әкімшіден оны «Көмек» бөлімінде тексеруді сұраңыз; жергілікті кеңестер жұмыс істейді.'),
 AI_PROVIDER_HTTP_403:text('The service denied access. Ask your administrator to check the assistant account and model permissions.','Сервис запретил доступ. Попроси администратора проверить учётную запись помощника и доступ к модели.','Қызмет кіруге тыйым салды. Әкімшіден көмекші тіркелгісі мен модельге қолжетімділікті тексеруді сұраңыз.'),
 AI_PROVIDER_HTTP_404:text('The service could not find the requested resource. Ask your administrator to check the model and service settings.','Сервис не нашёл запрошенный ресурс. Попроси администратора проверить модель и настройки сервиса.','Қызмет сұралған ресурсты таппады. Әкімшіден модель мен қызмет баптауларын тексеруді сұраңыз.'),
 AI_PROVIDER_HTTP_429:text('The service is limiting requests. Try later, or ask your administrator to check access. Local hints remain available.','Сервис ограничивает запросы. Попробуй позже или попроси администратора проверить доступ. Локальные подсказки доступны.','Қызмет сұрауларды шектеп жатыр. Кейінірек көріңіз немесе әкімшіден қолжетімділікті тексеруді сұраңыз. Жергілікті кеңестер қолжетімді.'),
 AI_REQUEST_FAILED:unavailable
};
/** Backend details can include private data; show only trusted localized copy. */
export function assistantErrorText(error:{code:string},locale:Locale):string{
 if(Object.hasOwn(messages,error.code))return messages[error.code]![locale];
 return unavailable[locale];
}
