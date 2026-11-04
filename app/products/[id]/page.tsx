import {notFound} from 'next/navigation';
import {database} from '@/db';
import {getSiteContent} from '@/lib/site-content-server';
import {expireOrders} from '@/lib/shop';
import {whatsapp,Product} from '@/lib/catalog';
import {ShopFrame,AddToCart} from '@/components/storefront/shop';
export const dynamic='force-dynamic';
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;await expireOrders();const product=await database().query<Product>('SELECT * FROM sheochand.products WHERE id=$1 AND published=1',[id]).then(result=>result.rows[0]??null);if(!product)notFound();const content=await getSiteContent();return <ShopFrame><a className="text-link" href="/#collection">← Collection</a><section className="product-detail"><img src={product.image_url} alt={product.name}/><div><p className="eyebrow">{content.collections.find(c=>c.id===product.category)?.label}</p><h1>{product.name}</h1><p>{product.description}</p><p className="muted">{product.purity}</p><AddToCart product={product}/><div className="actions"><a href={whatsapp('Hello, please share details about '+product.name+' ('+product.id+').',content.whatsapp)} className="text-link" target="_blank" rel="noreferrer">Enquire on WhatsApp</a>{product.overlay_url&&<a className="text-link" href="/try-on">Try on with camera</a>}</div><p className="muted">{content.checkoutNote}</p><a className="text-link" href="/policies">Shop policies</a></div></section></ShopFrame>;}
