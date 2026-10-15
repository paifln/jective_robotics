import type {Locale} from './locale';

/** A rejected bridge call must not expose raw exception payloads to a learner. */
export function deviceConnectionFailure(locale:Locale){
 return {
  en:'Could not communicate with the board tools. Check the USB connection and try again. Your project is unchanged.',
  ru:'Не удалось связаться с инструментами платы. Проверь USB-подключение и попробуй ещё раз. Проект не изменён.',
  kk:'Тақша құралдарымен байланысу мүмкін болмады. USB қосылымын тексеріп, қайта көр. Жоба өзгерген жоқ.'
 }[locale];
}
