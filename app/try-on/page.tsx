import {Brand} from '@/components/storefront/site-provider';
import { initialiseTryonAssets } from '@/lib/tryon-assets';
import { redirect } from 'next/navigation';
import {getCustomerUser} from '@/lib/auth/user';
import {CustomerSignOut} from '@/components/storefront/customer-auth';
import Studio from '@/components/storefront/studio';
import { database } from '@/db';
import type { Product } from '@/lib/catalog';
export const dynamic = 'force-dynamic';
export default async function TryOn({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) {
    const query=await searchParams;const selected=typeof query.piece==='string'&&/^[a-z\d-]{1,64}$/.test(query.piece)?query.piece:'';
    const user = await getCustomerUser(); if (!user) redirect('/login?next='+encodeURIComponent('/try-on'+(selected?'?piece='+selected:'')));
    let products: Product[] = []; let unavailable = false;
    try { await initialiseTryonAssets(); products = (await database().query<Product>("SELECT * FROM sheochand.products WHERE published=1 AND image_url<>'' ORDER BY id",[])).rows; } catch (error) { console.error(error); unavailable = true; }
    return <main className="customer-studio"><header><Brand/><nav><a className="customer-account-link" href="/login">Your account</a><CustomerSignOut/></nav></header>{unavailable ? <section className="studio-unavailable"><h1>The studio is temporarily unavailable.</h1><p>Your camera has not been started. Please try again shortly.</p><a className="button" href="/try-on">Try again</a></section> : <Studio products={products} initialPiece={selected} />}<p className="studio-account">Signed in as {user.email} · <a href="/">Return to the collection</a></p></main>;
}
