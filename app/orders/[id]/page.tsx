import {getCustomerUser} from '@/lib/auth/user';
import {redirect,notFound} from 'next/navigation';
import {database} from '@/db';
import {expireOrders} from '@/lib/shop';
import {OrderDetail} from '@/components/storefront/shop';
import type {StoreOrder} from '@/lib/shop-types';
export const dynamic='force-dynamic';
export default async function Page({params}:{params:Promise<{id:string}>}){const user=await getCustomerUser();if(!user)redirect('/login?next=%2Forders');await expireOrders();const {id}=await params;const order=await database().query<StoreOrder>('SELECT * FROM sheochand.orders WHERE id=$1 AND owner_id=$2',[id,user.userId]).then(result=>result.rows[0]??null);if(!order)notFound();return <OrderDetail initial={order}/>;}
