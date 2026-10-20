import {Brand} from '@/components/storefront/site-provider';
import { initialiseTryonAssets } from '@/lib/tryon-assets';
import { redirect } from 'next/navigation';
import { getChatGPTUser, chatGPTSignOutPath } from '@/app/chatgpt-auth';
import Studio from '@/components/storefront/studio';
import { database } from '@/db';
import type { Product } from '@/lib/catalog';
export const dynamic = 'force-dynamic';
export default async function TryOn() {
    const user = await getChatGPTUser(); if (!user) redirect('/login?next=%2Ftry-on');
    let products: Product[] = []; let unavailable = false;
    try { await initialiseTryonAssets(); products = (await database().prepare("SELECT * FROM products WHERE published=1 AND overlay_url<>'' AND kind<>'ring' ORDER BY id").all<Product>()).results; } catch (error) { console.error(error); unavailable = true; }
    return <main className="customer-studio"><header><Brand/><nav><a className="customer-account-link" href="/login">Your account</a><a className="customer-account-link" href={chatGPTSignOutPath('/')} target="_top">Sign out</a></nav></header>{unavailable ? <section className="studio-unavailable"><h1>The studio is temporarily unavailable.</h1><p>Your camera has not been started. Please try again shortly.</p><a className="button" href="/try-on">Try again</a></section> : <Studio products={products} />}<p className="studio-account">Signed in as {user.email} · <a href="/">Return to the collection</a></p></main>;
}
