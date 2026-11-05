import {notFound} from 'next/navigation';
import {database} from '@/db';
import {expireOrders} from '@/lib/shop';
import type {Product} from '@/lib/catalog';
import {jewelleryTypes} from '@/lib/jewellery-types';
import {ShopFrame} from '@/components/storefront/shop';
import Catalogue from '@/components/storefront/catalogue';
export const dynamic='force-dynamic';
export async function generateMetadata({params}:{params:Promise<{category:string}>}){
 const {category}=await params;const section=jewelleryTypes.find(t=>t.slug===category);
 return {title:section?section.label+' | Sheochand Jewellery':'Collection not found',description:section?'Explore '+section.label+' at Sheochand Jewellery. Discover available pieces and order directly from the shop.':undefined};
}
export default async function Page({params,searchParams}:{params:Promise<{category:string}>;searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const {category}=await params;const section=jewelleryTypes.find(t=>t.slug===category);if(!section)notFound();
 await expireOrders();
 const {rows}=await database().query<Product>('SELECT * FROM sheochand.products WHERE published=1 AND kind=$1 ORDER BY id',[section.id]);
 const query=await searchParams;
 return <ShopFrame active="shop"><Catalogue products={rows} section={section} initial={Object.fromEntries(Object.entries(query).map(([k,v])=>[k,typeof v==='string'?v:'']))}/></ShopFrame>;
}
