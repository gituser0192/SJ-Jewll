'use client';
import {createContext,useContext} from 'react';
import {defaultContent,type SiteContent} from '@/lib/site-content';
import {whatsapp as link} from '@/lib/catalog';
const SiteContext=createContext<SiteContent>(defaultContent);
export function SiteProvider({content,children}:{content:SiteContent;children:React.ReactNode}){return <SiteContext.Provider value={content}>{children}</SiteContext.Provider>;}
export function useSite(){const content=useContext(SiteContext);return {content,whatsapp:(message:string)=>link(message,content.whatsapp),categories:[['all','All masterpieces'],...content.collections.map(c=>[c.id,c.label])]};}
export function Brand({href='/'}:{href?:string}){const {content}=useSite();return <a className="brand" href={href}>{content.monogram}<span>{content.brandName.toUpperCase()}<small>{content.tagline}</small></span></a>;}
