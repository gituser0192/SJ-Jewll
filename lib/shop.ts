import {database} from '@/db';
import type {Product} from './catalog';
import type {OrderItem,StoreOrder} from './shop-types';
export async function expireOrders(){await database().prepare("UPDATE orders SET status='EXPIRED',inventory_state='RELEASED' WHERE status='PENDING' AND inventory_state='RESERVED' AND expires_at<?").bind(new Date().toISOString()).run();}
export async function cart(owner:string){
 const rows=await database().prepare('SELECT c.product_id,c.quantity,p.* FROM cart_items c LEFT JOIN products p ON p.id=c.product_id WHERE c.owner_id=? ORDER BY c.product_id').bind(owner).all<Product&{product_id:string;quantity:number}>();
 const items=rows.results.map(p=>({...p,id:p.product_id,available:Math.max(0,(p.stock??0)-(p.reserved??0)),buyable:p.published===1&&(p.price_paise??0)>0&&p.quantity<=(p.stock??0)-(p.reserved??0)}));
 const subtotal=items.reduce((sum,p)=>sum+(p.price_paise??0)*p.quantity,0);
 const fingerprint=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(items.map(p=>[p.id,p.quantity,p.price_paise,p.buyable])))))).map(n=>n.toString(16).padStart(2,'0')).join('');
 return {items,subtotal,fingerprint};
}
export function orderItems(order:StoreOrder):OrderItem[]{return JSON.parse(order.items);}
export async function adminOrder(id:string,action:string,tracking:string){
 const db=database();await expireOrders();
 const changes:Record<string,string>={confirm:"status='CONFIRMED'",fulfil:"status='FULFILLED',inventory_state='COMMITTED',tracking=?",cancel:"status='CANCELLED',inventory_state='RELEASED'",paid:"payment_status='PAID'"};
 const conditions:Record<string,string>={confirm:"status='PENDING'",fulfil:"status='CONFIRMED'",cancel:"status IN('PENDING','CONFIRMED') AND payment_status='UNPAID'",paid:"status IN('CONFIRMED','FULFILLED') AND payment_mode='REQUEST' AND payment_status='UNPAID'"};
 if(!changes[action])throw new Error('Invalid order action.');
 const result=await db.prepare(`UPDATE orders SET ${changes[action]} WHERE id=? AND ${conditions[action]}`).bind(...(action==='fulfil'?[tracking,id]:[id])).run();
 if(!result.meta.changes)throw new Error('Order has changed. Refresh before trying again. Paid orders cannot be cancelled here.');
}
