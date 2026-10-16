import type {BuildStage,EnvironmentProgress} from '../../../packages/contracts/build-stage';
import type {Locale} from './locale';
const text:Record<BuildStage,Record<Locale,string>>={
 toolchain:{en:'Checking the approved compiler and board support…',ru:'Проверяем компилятор и поддержку платы…',kk:'Компилятор мен тақша қолдауын тексеріп жатырмыз…'},
 'environment-before':{en:'Checking toolchain files before compilation. This can take a while…',ru:'Проверяем файлы инструментов перед сборкой. Это может занять время…',kk:'Құрастыру алдында құрал файлдарын тексеріп жатырмыз. Бұл уақыт алуы мүмкін…'},
 compile:{en:'Compiling your code with Arduino CLI…',ru:'Компилируем твой код с помощью Arduino CLI…',kk:'Кодыңды Arduino CLI арқылы құрастырып жатырмыз…'},
 'environment-after':{en:'Compilation finished. Checking that toolchain files stayed unchanged…',ru:'Компиляция завершилась. Проверяем, что файлы инструментов не изменились…',kk:'Компиляция аяқталды. Құрал файлдары өзгермегенін тексеріп жатырмыз…'},
 artifacts:{en:'Checking the build result and saving its report…',ru:'Проверяем результат сборки и сохраняем отчёт…',kk:'Құрастыру нәтижесін тексеріп, есепті сақтап жатырмыз…'}
};
export function buildStageText(stage:BuildStage,locale:Locale){return text[stage][locale];}
export function buildProgressText(progress:EnvironmentProgress,locale:Locale){
 const number=new Intl.NumberFormat(locale,{maximumFractionDigits:1}),files=number.format(progress.files),size=number.format(progress.bytes/1024**2),seconds=number.format(Math.floor(progress.elapsedMs/1000));
 const detail={en:`Files checked: ${files} · ${size} MiB · ${seconds} s`,ru:`Проверено файлов: ${files} · ${size} МиБ · ${seconds} с`,kk:`Тексерілген файлдар: ${files} · ${size} МиБ · ${seconds} с`};
 return detail[locale];
}
