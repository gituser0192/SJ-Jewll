import {getChatGPTUser} from '@/app/chatgpt-auth';
import {database} from '@/db';
import {limitedBody,sameOrigin} from '@/lib/admin';
import {cart,expireOrders} from '@/lib/shop';
import {getSiteContent} from '@/lib/site-content-server';
import type {StoreOrder} from '@/lib/shop-types';
import {z} from 'zod';
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'private, no-store'}});
export async function GET(request:Request){try{
 const user=await getChatGPTUser();if(!user)return json({error:'Sign in to shop.'},401);
 await expireOrders();const db=database(),id=new URL(request.url).searchParams.get('id');
 if(id){const order=await db.query('SELECT * FROM sheochand.orders WHERE id=$1 AND owner_id=$2',[id,user.userId]).then(result=>result.rows[0]??null);return order?json({order}):json({error:'Order not found.'},404);}
 const [selection,orders,content]=await Promise.all([cart(user.userId),db.query('SELECT * FROM sheochand.orders WHERE owner_id=$1 ORDER BY created_at DESC LIMIT 100',[user.userId]),getSiteContent()]);
 return json({...selection,orders:orders.rows,deliveryEnabled:content.deliveryEnabled,shippingPaise:content.shippingPaise,checkoutNote:content.checkoutNote});
 }catch(error){console.error(error);return json({error:'The shop is temporarily unavailable. Please retry.'},503);}}
const checkout=z.object({requestKey:z.string().uuid(),fingerprint:z.string().length(64),expectedTotal:z.number().int().nonnegative(),fullName:z.string().trim().min(2).max(100),phone:z.string().trim().regex(/^\+?[\d\s()-]{10,20}$/),fulfilment:z.enum(['pickup','delivery']),address:z.string().trim().max(1000).default(''),notes:z.string().trim().max(1000).default(''),consent:z.literal(true)});
export async function POST(request:Request){try{
 if(!sameOrigin(request))return json({error:'Request origin rejected.'},403);
 const user=await getChatGPTUser();if(!user)return json({error:'Sign in to shop.'},401);
 let body;try{body=JSON.parse(new TextDecoder().decode(await limitedBody(request,8000)));}catch{return json({error:'Invalid request.'},400);}
 const db=database();await expireOrders();
 if(body.action==='cart'){
  const parsed=z.object({id:z.string().regex(/^[a-z\d-]{1,64}$/),quantity:z.number().int().min(0).max(20),add:z.boolean().default(false)}).safeParse(body);
  if(!parsed.success)return json({error:'Choose a quantity between 0 and 20.'},400);const p=parsed.data;
  if(p.quantity===0){await db.query('DELETE FROM sheochand.cart_items WHERE owner_id=$1 AND product_id=$2',[user.userId,p.id]);return json({saved:true});}
  const result=await db.query(`INSERT INTO sheochand.cart_items(owner_id,product_id,quantity) SELECT $1,id,$2 FROM sheochand.products WHERE id=$3 AND published=1 AND price_paise>0 AND stock-reserved>=$4 AND ((SELECT count(*) FROM sheochand.cart_items WHERE owner_id=$5)<50 OR EXISTS(SELECT 1 FROM sheochand.cart_items WHERE owner_id=$6 AND product_id=$7)) ON CONFLICT(owner_id,product_id) DO UPDATE SET quantity=${p.add?'cart_items.quantity+excluded.quantity':'excluded.quantity'} WHERE ${p.add?'cart_items.quantity+excluded.quantity':'excluded.quantity'}<=20 AND ${p.add?'cart_items.quantity+excluded.quantity':'excluded.quantity'}<=(SELECT stock-reserved FROM sheochand.products WHERE id=excluded.product_id AND published=1 AND price_paise>0)`,[user.userId,p.quantity,p.id,p.quantity,user.userId,user.userId,p.id]);
  return result.rowCount?json({saved:true}):json({error:'This quantity is unavailable, or your cart has reached its limit. Refresh your cart.'},409);
 }
 if(body.action==='cancel'){
  if(!z.string().uuid().safeParse(body.id).success)return json({error:'Invalid order.'},400);
  const result=await db.query("UPDATE sheochand.orders SET status='CANCELLED',inventory_state='RELEASED' WHERE id=$1 AND owner_id=$2 AND status='PENDING' AND payment_status='UNPAID'",[body.id,user.userId]);
  return result.rowCount?json({saved:true}):json({error:'This order can no longer be cancelled online. Please contact the shop.'},409);
 }
 if(body.action!=='checkout')return json({error:'Unknown operation.'},400);
 const parsed=checkout.safeParse(body);if(!parsed.success)return json({error:parsed.error.issues[0]?.message??'Check your details.'},400);const input=parsed.data;
 const previous=await db.query<StoreOrder>('SELECT * FROM sheochand.orders WHERE owner_id=$1 AND request_key=$2',[user.userId,input.requestKey]).then(result=>result.rows[0]??null);if(previous)return json({id:previous.id});
 const pending=await db.query<{count:number}>("SELECT count(*) AS count FROM sheochand.orders WHERE owner_id=$1 AND status='PENDING'",[user.userId]).then(result=>result.rows[0]??null);if((pending?.count??0)>=5)return json({error:'You already have five pending requests. Please contact the shop or cancel an earlier request.'},409);
 const [selection,content]=await Promise.all([cart(user.userId),getSiteContent()]);
 if(!selection.items.length||selection.items.some(p=>!p.buyable))return json({error:'Some pieces are unavailable. Update your cart before checkout.'},409);
 if(input.fulfilment==='delivery'&&(!content.deliveryEnabled||input.address.length<10))return json({error:'Choose pickup, or enter a complete delivery address when delivery is available.'},400);
 const shipping=input.fulfilment==='delivery'?content.shippingPaise:0,total=selection.subtotal+shipping;
 if(input.fingerprint!==selection.fingerprint||input.expectedTotal!==total)return json({error:'Prices or delivery charges changed. Refresh your cart and review the new total.'},409);
 const id=crypto.randomUUID(),created=new Date().toISOString(),expires=new Date(Date.now()+86400000).toISOString();
 const items=selection.items.map(p=>({id:p.id,name:p.name,image_url:p.image_url,quantity:p.quantity,unit_price:p.price_paise!}));
 try{await db.transaction([
  {text:"INSERT INTO sheochand.orders(id,owner_id,request_key,full_name,phone,email,fulfilment,address,notes,items,subtotal_paise,shipping_paise,total_paise,status,payment_mode,inventory_state,expires_at,created_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'PENDING','REQUEST','RESERVED',$14,$15)",params:[id,user.userId,input.requestKey,input.fullName,input.phone,user.email,input.fulfilment,input.fulfilment==='delivery'?input.address:'',input.notes,JSON.stringify(items),selection.subtotal,shipping,total,expires,created]},
  ...items.map(p=>({text:'DELETE FROM sheochand.cart_items WHERE owner_id=$1 AND product_id=$2 AND quantity=$3',params:[user.userId,p.id,p.quantity]}))
 ]);}catch(error){const duplicate=await db.query<{id:string}>('SELECT id FROM sheochand.orders WHERE owner_id=$1 AND request_key=$2',[user.userId,input.requestKey]).then(result=>result.rows[0]??null);if(duplicate)return json({id:duplicate.id});console.error(error);return json({error:'Availability changed while ordering. Refresh your cart and try again.'},409);}
 return json({id},201);
 }catch(error){console.error(error);return json({error:'Could not complete the request. Retry with the same checkout form.'},503);}}
