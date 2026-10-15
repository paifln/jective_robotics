import {it,expect} from 'vitest';
import {manual} from '../packages/content/manual';
import {Localized} from '../packages/content';
it('ships complete localized manual sections and current independent-learning instructions',()=>{
 expect(manual).toHaveLength(8);expect(new Set(manual.map(p=>p.id)).size).toBe(8);
 for(const page of manual){Localized.parse(page.title);Localized.parse(page.body);for(const locale of ['en','ru','kk'] as const)expect(page.body[locale].length).toBeGreaterThan(200);}
 expect(manual.find(p=>p.id==='editors')!.body.en).toContain('different files');expect(manual.find(p=>p.id==='editors')!.body.ru).toContain('Урок 37');
 const assistant=manual.find(p=>p.id==='assistant')!;expect(assistant.body.en).toContain('shared OpenAI key stays on the server');expect(assistant.body.en).toContain('up to ten recent conversation messages');expect(assistant.body.ru).toContain('Общий ключ OpenAI остаётся на сервере');expect(assistant.body.kk).toContain('Ортақ OpenAI кілті серверде қалады');expect(assistant.body.ru).toContain('Добавить мой код');for(const text of Object.values(assistant.body))expect(text).not.toMatch(/Administrator: configure assistant|Администратор: настройка помощника|Әкімші: көмекшіні баптау/);
 expect(manual.find(p=>p.id==='classroom')!.title.en).toContain('Study independently');expect(manual.find(p=>p.id==='classroom')!.body.ru).toContain('Создавать локальный класс');expect(manual.find(p=>p.id==='install')!.body.en).toContain('sixteen worlds');
});
