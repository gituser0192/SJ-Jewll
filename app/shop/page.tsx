import {database} from '@/db';
import {expireOrders} from '@/lib/shop';
import type {Product} from '@/lib/catalog';
import {ShopFrame} from '@/components/storefront/shop';
import Catalogue from '@/components/storefront/catalogue';
export const dynamic='force-dynamic';
export const metadata={title:'Shop jewellery | Sheochand Jewellery',description:'Explore the Sheochand collection. Find necklaces, earrings and rings, check availability and place your order with the shop.'};
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 await expireOrders();
 const {rows}=await database().query<Product>('SELECT * FROM sheochand.products WHERE published=1 ORDER BY id');
 const query=await searchParams;
 return <ShopFrame active="shop"><Catalogue products={rows} initial={Object.fromEntries(Object.entries(query).map(([key,value])=>[key,typeof value==='string'?value:'']))}/></ShopFrame>;
}
