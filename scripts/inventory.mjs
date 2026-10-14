import {readFile,writeFile,mkdir,copyFile,readdir} from 'node:fs/promises';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
const lock=JSON.parse(await readFile('package-lock.json','utf8'));await mkdir('evidence',{recursive:true});
const components=Object.entries(lock.packages).filter(([path])=>path.startsWith('node_modules/')).map(([path,p])=>({type:'library',name:path.split('node_modules/').at(-1),version:p.version,licenses:p.license?[{license:{name:p.license}}]:[],properties:[{name:'developmentDependency',value:String(!!p.dev)}]}));
await writeFile('evidence/sbom.cdx.json',JSON.stringify({bomFormat:'CycloneDX',specVersion:'1.6',version:1,metadata:{timestamp:new Date().toISOString()},components},null,2));
await mkdir('dist/licenses',{recursive:true});await copyFile('node_modules/electron/dist/LICENSE','dist/licenses/Electron-LICENSE.txt');await copyFile('node_modules/electron/dist/LICENSES.chromium.html','dist/licenses/Chromium-LICENSES.html');
const licenseReview=[];
for(const [path,p] of Object.entries(lock.packages).filter(([path,p])=>path.startsWith('node_modules/')&&!p.dev)){try{const files=await readdir(path);const notices=files.filter(f=>/^(licen[cs]e|copying|notice)/i.test(f));if(!notices.length)licenseReview.push({path,license:p.license,status:'License text location requires review'});for(const file of notices)try{await copyFile(join(path,file),join('dist/licenses',path.replace(/[/\\]/g,'_')+'-'+file));}catch{licenseReview.push({path,file,status:'Notice may be a directory; manual review required'});}}catch(e){licenseReview.push({path,status:String(e)});}}
await writeFile('evidence/license-review.json',JSON.stringify(licenseReview,null,2));
for(let i=licenseReview.length-1;i>=0;i--)if(licenseReview[i].path==='node_modules/saxes'){await copyFile('assets/licenses/saxes-6.0.0-LICENSE.txt','dist/licenses/saxes-6.0.0-LICENSE.txt');licenseReview.splice(i,1);}
await writeFile('evidence/license-review.json',JSON.stringify(licenseReview,null,2));
await writeFile('dist/licenses/inventory.json',JSON.stringify(components.filter(c=>c.properties[0].value==='false'),null,2));
const checksums=[];try{for(const name of await readdir('release'))if(name.endsWith('.exe')){const bytes=await readFile(join('release',name));checksums.push({name,sizeBytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});}}catch{ /* Packaging may not have run yet. */ }
await writeFile('evidence/artifacts.json',JSON.stringify(checksums,null,2));
