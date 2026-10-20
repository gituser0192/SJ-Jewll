import {getChatGPTUser} from '@/app/chatgpt-auth';
import {redirect,notFound} from 'next/navigation';
import {database} from '@/db';
import {expireOrders} from '@/lib/shop';
import {OrderDetail} from '@/components/storefront/shop';
import type {StoreOrder} from '@/lib/shop-types';
export const dynamic='force-dynamic';
export default async function Page({params}:{params:Promise<{id:string}>}){const user=await getChatGPTUser();if(!user)redirect('/login?next=%2Forders');await expireOrders();const {id}=await params;const order=await database().prepare('SELECT * FROM orders WHERE id=? AND owner_id=?').bind(id,user.userId).first<StoreOrder>();if(!order)notFound();return <OrderDetail initial={order}/>;}
