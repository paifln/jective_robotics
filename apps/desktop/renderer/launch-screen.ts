import {launchMotivations,selectLaunchMotivation,type MotivationLocale} from '../../../packages/engagement/launch-motivation';
let finishing=false;
const minimumLaunchTimeMs=3500;
let previous:string|null=null;
try{previous=localStorage.getItem('jective-launch-motivation');}catch{/* Optional rotation persistence. */}
// The tiny boot entry runs before the editor bundle. Reuse its selected item
// when the main bundle imports this module, keeping one quote per launch.
const earlyId=document.querySelector<HTMLElement>('#launch-screen .launch-motivation')?.dataset.motivationId;
const motivation=launchMotivations.find(item=>item.id===earlyId)??selectLaunchMotivation(previous,Math.random());
try{localStorage.setItem('jective-launch-motivation',motivation.id);}catch{/* Works offline without storage. */}
export function localizeLaunchMotivation(locale:MotivationLocale){
 const screen=document.getElementById('launch-screen');if(!screen)return;
 let figure=screen.querySelector<HTMLElement>('.launch-motivation');
 if(!figure){figure=document.createElement('figure');figure.className='launch-motivation';figure.append(document.createElement('blockquote'),document.createElement('figcaption'));screen.append(figure);}
 figure.dataset.motivationId=motivation.id;
 figure.querySelector('blockquote')!.textContent=motivation.text[locale];
 figure.querySelector('figcaption')!.textContent=motivation.author+(motivation.source&&locale!=='en'?(locale==='ru'?' · перевод':' · аударма'):'');
 figure.title=motivation.source??'JECTIVE';screen.lang=locale;
 screen.setAttribute('aria-label',locale==='ru'?'JECTIVE Robotics Studio загружается':locale==='kk'?'JECTIVE Robotics Studio жүктелуде':'JECTIVE Robotics Studio is loading');
}
localizeLaunchMotivation('ru');
export function finishLaunchScreen(){
 if(finishing)return;finishing=true;
 setTimeout(()=>{document.getElementById('launch-screen')?.classList.add('launch-complete');setTimeout(()=>document.getElementById('launch-screen')?.remove(),450);},Math.max(0,minimumLaunchTimeMs-performance.now()));
}
