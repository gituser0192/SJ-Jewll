import {getChatGPTUser} from '@/app/chatgpt-auth';
import {redirect} from 'next/navigation';
import {database} from '@/db';
import {expireOrders} from '@/lib/shop';
import {ShopFrame} from '@/components/storefront/shop';
import {money,StoreOrder} from '@/lib/shop-types';
export const dynamic='force-dynamic';
export default async function Page(){const user=await getChatGPTUser();if(!user)redirect('/login?next=%2Forders');await expireOrders();const rows=await database().prepare('SELECT * FROM orders WHERE owner_id=? ORDER BY created_at DESC LIMIT 100').bind(user.userId).all<StoreOrder>();return <ShopFrame><p className="eyebrow">YOUR ACCOUNT</p><h1>Your orders.</h1><p>Signed in as {user.email}</p><div className="orders-list">{rows.results.map(o=><a className="admin-card order-list-item" href={'/orders/'+o.id} key={o.id}><strong>#{o.id.slice(0,8)}</strong><span>{o.status} · {o.payment_status}</span><span>{money(o.total_paise)}</span><small>{new Date(o.created_at).toLocaleDateString('en-IN',{timeZone:'Asia/Kolkata'})}</small></a>)}</div>{!rows.results.length&&<p>You have no orders yet. <a className="text-link" href="/#collection">Explore the collection</a></p>}</ShopFrame>;}
