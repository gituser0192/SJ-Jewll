'use client';
import {useRef} from 'react';
import {Expand,X} from 'lucide-react';
export default function ProductPhoto({src,name}:{src:string;name:string}){const dialog=useRef<HTMLDialogElement>(null);return <div className="product-gallery"><button className="product-gallery-open" aria-label={'Enlarge photograph of '+name} onClick={()=>dialog.current?.showModal()}><img src={src} alt={name} fetchPriority="high"/><span><Expand size={16}/> View closer</span></button><p>Photograph of the featured piece. Ask the shop to confirm specifications before ordering.</p><dialog className="product-lightbox" ref={dialog}><button aria-label="Close enlarged photograph" onClick={()=>dialog.current?.close()}><X size={24}/></button><img src={src} alt={name}/><p>{name}</p></dialog></div>;}
