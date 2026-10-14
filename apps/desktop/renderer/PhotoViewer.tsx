import React,{useEffect,useRef,useId} from 'react';
import type {Locale} from './locale';
import {words} from './StudentUI';
import {Brand} from './Brand';
import type {ComponentPhoto} from '../../../packages/content/component-photos';
export function PhotoViewer({photo,locale,close}:{photo:Pick<ComponentPhoto,'src'|'title'|'author'|'license'|'licenseUrl'|'source'>|null;locale:Locale;close:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null);const titleId=useId();
 useEffect(()=>{if(photo&&!dialog.current?.open)dialog.current?.showModal();if(!photo&&dialog.current?.open)dialog.current.close();},[photo]);
 return <dialog ref={dialog} className="photo-viewer" aria-labelledby={photo?titleId:undefined} onClose={close}><div className="photo-viewer-header"><Brand/><button onClick={()=>dialog.current?.close()} aria-label={words(locale,'Close image','Закрыть изображение','Суретті жабу')}>{words(locale,'Close','Закрыть','Жабу')} ×</button></div>{photo&&<><h3 id={titleId}>{photo.title[locale]}</h3><img src={photo.src} alt={photo.title[locale]}/><p className="photo-credit">{photo.author} · {photo.license}</p><details className="photo-source"><summary>{words(locale,'Photo source','Источник фотографии','Фотосурет дереккөзі')}</summary><p>{photo.source}</p>{photo.licenseUrl!==photo.source&&<p>{photo.licenseUrl}</p>}</details></>}</dialog>;
}
