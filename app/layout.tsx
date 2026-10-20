import type {Metadata} from 'next';
import {getSiteContent} from '@/lib/site-content-server';
import {SiteProvider} from '@/components/storefront/site-provider';
import './globals.css';
export async function generateMetadata():Promise<Metadata>{const c=await getSiteContent();return {title:c.seoTitle,description:c.seoDescription,icons:{icon:'/favicon.svg'}};}
export default async function RootLayout({children}:{children:React.ReactNode}){const content=await getSiteContent();return <html lang="en"><body className="antialiased"><SiteProvider content={content}>{children}</SiteProvider></body></html>;}
