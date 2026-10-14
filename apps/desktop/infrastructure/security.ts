import {resolve,relative,isAbsolute,extname} from 'node:path';
const assetExtensions=new Set(['.html','.js','.css','.svg','.png','.jpg','.jpeg','.gif','.ttf','.woff','.woff2','.json','.mp3','.wav','.ogg','.cur']);
export function trustedStudioDocument(value:string){try{const u=new URL(value);return u.protocol==='jective:'&&u.host==='studio'&&!u.username&&!u.password&&u.pathname==='/index.html'&&!u.search;}catch{return false;}}
export function containedPath(root:string,target:string){const rel=relative(root,target);return rel!==''&&!rel.startsWith('..')&&!isAbsolute(rel);}
export function studioAsset(root:string,value:string,method='GET'){
 try{const u=new URL(value);if(method!=='GET'||u.protocol!=='jective:'||u.host!=='studio'||u.username||u.password)return null;const path=decodeURIComponent(u.pathname);if(path.includes('\\')||path.includes('\0')||path.includes(':')||path.split('/').some(p=>p==='..'||p.startsWith('.'))||!assetExtensions.has(extname(path).toLowerCase()))return null;const target=resolve(root,'.'+path);return containedPath(root,target)?target:null;}catch{return null;}
}
