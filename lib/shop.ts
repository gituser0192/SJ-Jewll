import {database} from '@/db';
import type {Product} from './catalog';
import type {OrderItem,StoreOrder} from './shop-types';
export async function expireOrders(){await database().query("UPDATE sheochand.orders SET status='EXPIRED',inventory_state='RELEASED' WHERE status='PENDING' AND inventory_state='RESERVED' AND expires_at<$1",[new Date().toISOString()]);}
export async function cart(owner:string){
 const rows=await database().query<Product&{product_id:string;quantity:number}>('SELECT c.product_id,c.quantity,p.* FROM sheochand.cart_items c LEFT JOIN sheochand.products p ON p.id=c.product_id WHERE c.owner_id=$1 ORDER BY c.product_id',[owner]);
 const items=rows.rows.map(p=>({...p,id:p.product_id,available:Math.max(0,(p.stock??0)-(p.reserved??0)),buyable:p.published===1&&(p.price_paise??0)>0&&p.quantity<=(p.stock??0)-(p.reserved??0)}));
 const subtotal=items.reduce((sum,p)=>sum+(p.price_paise??0)*p.quantity,0);
 const fingerprint=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(items.map(p=>[p.id,p.quantity,p.price_paise,p.buyable])))))).map(n=>n.toString(16).padStart(2,'0')).join('');
 return {items,subtotal,fingerprint};
}
export function orderItems(order:StoreOrder):OrderItem[]{return JSON.parse(order.items);}
export async function adminOrder(id:string,action:string,tracking:string){
 const db=database();await expireOrders();
 const changes:Record<string,string>={confirm:"status='CONFIRMED'",fulfil:"status='FULFILLED',inventory_state='COMMITTED',tracking=$1",cancel:"status='CANCELLED',inventory_state='RELEASED'",paid:"payment_status='PAID'"};
 const conditions:Record<string,string>={confirm:"status='PENDING'",fulfil:"status='CONFIRMED'",cancel:"status IN('PENDING','CONFIRMED') AND payment_status='UNPAID'",paid:"status IN('CONFIRMED','FULFILLED') AND payment_mode='REQUEST' AND payment_status='UNPAID'"};
 if(!changes[action])throw new Error('Invalid order action.');
 const result=await db.query(`UPDATE sheochand.orders SET ${changes[action]} WHERE id=${action==='fulfil'?'$2':'$1'} AND ${conditions[action]}`,[...(action==='fulfil'?[tracking,id]:[id])]);
 if(!result.rowCount)throw new Error('Order has changed. Refresh before trying again. Paid orders cannot be cancelled here.');
}
