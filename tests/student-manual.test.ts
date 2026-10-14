import {it,expect} from 'vitest';
import {manual} from '../packages/content/manual';
import {Localized} from '../packages/content';
it('ships complete localized manual sections and current independent-learning instructions',()=>{
 expect(manual).toHaveLength(8);expect(new Set(manual.map(p=>p.id)).size).toBe(8);
 for(const page of manual){Localized.parse(page.title);Localized.parse(page.body);for(const locale of ['en','ru','kk'] as const)expect(page.body[locale].length).toBeGreaterThan(200);}
 expect(manual.find(p=>p.id==='editors')!.body.en).toContain('different files');expect(manual.find(p=>p.id==='editors')!.body.ru).toContain('Урок 37');
 expect(manual.find(p=>p.id==='assistant')!.body.en).toContain('not protected by an administrator password');expect(manual.find(p=>p.id==='assistant')!.body.ru).toContain('Добавить мой код');
 expect(manual.find(p=>p.id==='classroom')!.title.en).toContain('Study independently');expect(manual.find(p=>p.id==='classroom')!.body.ru).toContain('Создавать локальный класс');expect(manual.find(p=>p.id==='install')!.body.en).toContain('sixteen worlds');
});
