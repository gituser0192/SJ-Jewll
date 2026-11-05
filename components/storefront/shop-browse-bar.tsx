'use client';
import {useEffect,useRef,useState} from 'react';
import {ChevronDown,Search,ArrowUpRight} from 'lucide-react';
import {jewelleryTypes} from '@/lib/jewellery-types';
import {useSite} from './site-provider';
export default function ShopBrowseBar(){
 const {content}=useSite();const [open,setOpen]=useState(false),[query,setQuery]=useState('');
 const menu=useRef<HTMLDivElement>(null),trigger=useRef<HTMLButtonElement>(null);
 useEffect(()=>{setQuery(new URLSearchParams(window.location.search).get('q')??'');},[]);
 useEffect(()=>{if(!open)return;const close=(event:PointerEvent)=>{if(!menu.current?.contains(event.target as Node))setOpen(false);};document.addEventListener('pointerdown',close);return()=>document.removeEventListener('pointerdown',close);},[open]);
 return <div className="shop-browse-bar"><div className="shop-browse-inner"><div ref={menu} className="shop-browse-menu" onPointerEnter={e=>{if(e.pointerType==='mouse')setOpen(true);}} onPointerLeave={e=>{if(e.pointerType==='mouse')setOpen(false);}} onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node))setOpen(false);}} onKeyDown={e=>{if(e.key==='Escape'){setOpen(false);trigger.current?.focus();}}}>
 <button ref={trigger} type="button" className="shop-browse-trigger" aria-expanded={open} aria-controls="shop-jewellery-menu" onClick={()=>setOpen(true)} onKeyDown={e=>{if(e.key==='ArrowDown'){e.preventDefault();setOpen(true);}}}>All jewellery <ChevronDown size={15}/></button>
 {open&&<div id="shop-jewellery-menu" className="shop-browse-dropdown"><div className="browse-dropdown-heading"><span className="eyebrow">FIND YOUR FOREVER PIECE</span><a href="/shop">View all jewellery <ArrowUpRight size={15}/></a></div><nav aria-label="All jewellery sections" className="browse-type-grid">{jewelleryTypes.map(t=><a href={'/shop/'+t.slug} key={t.id}>{t.label}<ArrowUpRight size={15}/></a>)}</nav><div className="browse-collections"><span>Explore our collections</span>{content.collections.map(c=><a key={c.id} href={'/shop?category='+encodeURIComponent(c.id)}>{c.label}</a>)}</div></div>}
 </div><nav className="browse-quick-links" aria-label="Jewellery categories">{jewelleryTypes.slice(0,6).map(t=><a key={t.id} href={'/shop/'+t.slug}>{t.label}</a>)}</nav><form className="shop-top-search" action="/shop" method="get" role="search"><Search size={16} aria-hidden="true"/><input name="q" type="search" aria-label="Search all jewellery" placeholder="Search jewellery…" value={query} onChange={e=>setQuery(e.target.value)} maxLength={150}/><button type="submit" aria-label="Submit jewellery search"><ArrowUpRight size={17}/></button></form></div></div>;
}
