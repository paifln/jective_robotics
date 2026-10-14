import {it,expect} from 'vitest';
import {indexLibrary,searchLibrary} from '../packages/content/library-search';
const rows=[{id:'L01',title:{en:'First lesson',ru:'Первый урок',kk:'Бірінші сабақ'},body:{en:'Read about L02 and heartbeat timeout.',ru:'Проверка таймера.',kk:'Уақытты тексеру.'}},{id:'L02',title:{en:'Timer',ru:'Таймер',kk:'Таймер'},body:{en:'Heartbeat timeout reset.',ru:'Ошибка подключения.',kk:'Қосылым қатесі.'}}];
it('finds body text, requires all words and prefers exact IDs over incidental mentions',()=>{
 const index=indexLibrary(rows,'en');expect(searchLibrary(index,' heartbeat TIMEOUT ','en')).toEqual(rows);expect(searchLibrary(index,'Ｌ０２','en')[0]?.id).toBe('L02');expect(searchLibrary(index,'heartbeat missing','en')).toEqual([]);expect(searchLibrary(index,'   ','en')).toEqual(rows);
});
it('searches the chosen language without including other locales or mutating records',()=>{
 expect(searchLibrary(indexLibrary(rows,'ru'),'ОШИБКА подключения','ru').map(row=>row.id)).toEqual(['L02']);expect(searchLibrary(indexLibrary(rows,'kk'),'ҚОСЫЛЫМ қатесі','kk').map(row=>row.id)).toEqual(['L02']);expect(searchLibrary(indexLibrary(rows,'ru'),'heartbeat','ru')).toEqual([]);expect(rows[0]!.title.en).toBe('First lesson');
});
it('ranks title matches above body mentions and keeps equivalent matches in authored order',()=>{
 const mention={...rows[0]!,body:{...rows[0]!.body,en:'Timer appears only in this paragraph.'}},third={...rows[1]!,id:'L03'};
 expect(searchLibrary(indexLibrary([mention,rows[1]!,third],'en'),'timer','en').map(row=>row.id)).toEqual(['L02','L03','L01']);
});
