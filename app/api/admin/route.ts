import {adminUser,limitedBody,sameOrigin} from '@/lib/admin';
import {database} from '@/db';
import {productInput} from '@/lib/product-input';
import {z} from 'zod';
import {contentSchema} from '@/lib/site-content';
import {getSiteContent} from '@/lib/site-content-server';
import {adminOrder,expireOrders} from '@/lib/shop';
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'private, no-store'}});
export async function GET(){try{const user=await adminUser();if(!user)return json({error:'Sign in with the authorised admin account.'},403);const db=database();await expireOrders();const [products,leads,rate,content,orders]=await Promise.all([db.prepare('SELECT * FROM products ORDER BY id').all(),db.prepare('SELECT * FROM consultation_leads ORDER BY created_at DESC LIMIT 200').all(),db.prepare('SELECT * FROM bullion_rates WHERE id=1').first(),getSiteContent(),db.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT 200').all()]);return json({account:user.email,products:products.results,leads:leads.results,rate,content,orders:orders.results});}catch(error){console.error(error);return json({error:'The shop desk is temporarily unavailable.'},503);}}
export async function POST(request:Request){try{
if(!sameOrigin(request))return json({error:'Request origin rejected.'},403);
if(!await adminUser())return json({error:'Sign in with the authorised admin account.'},403);
let body;try{body=JSON.parse(new TextDecoder().decode(await limitedBody(request,64000)));}catch{return json({error:'Invalid or oversized request.'},400);}const db=database();
if(body.type==='content'){
 const parsed=contentSchema.safeParse(body.content);if(!parsed.success)return json({error:parsed.error.issues[0]?.message??'Check the website fields.'},400);
 const ids=parsed.data.collections.map(c=>c.id);const used=await db.prepare('SELECT DISTINCT category FROM products').all<{category:string}>();if(used.results.some(p=>!ids.includes(p.category)))return json({error:'Move existing pieces to another collection before removing their collection.'},400);
 await db.prepare('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind('site_content',JSON.stringify(parsed.data)).run();return json({saved:true});
}
if(body.type==='order'){
 const parsed=z.object({id:z.string().uuid(),action:z.enum(['confirm','fulfil','cancel','paid']),tracking:z.string().trim().max(300).default('')}).safeParse(body);if(!parsed.success)return json({error:'Invalid order update.'},400);
 try{await adminOrder(parsed.data.id,parsed.data.action,parsed.data.tracking);return json({saved:true});}catch(error){return json({error:(error as Error).message},409);}
}
if(body.type==='product'){
  const parsed=productInput.safeParse(body.product);if(!parsed.success)return json({error:parsed.error.issues[0]?.message??'Check the product fields.'},400);
  const p=parsed.data;const content=await getSiteContent();if(!content.collections.some(c=>c.id===p.category))return json({error:'Choose a current website collection.'},400);const old=await db.prepare('SELECT reserved FROM products WHERE id=?').bind(p.id).first<{reserved:number}>();if(p.stock<(old?.reserved??0))return json({error:'Stock cannot be lower than the quantity reserved for orders.'},409);
  await db.prepare('INSERT INTO products (id,name,category,purity,description,image_url,kind,price_status,published,overlay_url,ar_scale,ar_offset,price_paise,stock) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,category=excluded.category,purity=excluded.purity,description=excluded.description,image_url=excluded.image_url,kind=excluded.kind,price_status=excluded.price_status,published=excluded.published,overlay_url=excluded.overlay_url,ar_scale=excluded.ar_scale,ar_offset=excluded.ar_offset,price_paise=excluded.price_paise,stock=excluded.stock').bind(p.id,p.name,p.category,p.purity,p.description,p.image_url,p.kind,p.price_status,p.published?1:0,p.overlay_url,p.ar_scale,p.ar_offset,p.price_paise,p.stock).run();return json({saved:true,id:p.id});
}
if(body.type==='remove'){
 const parsed=z.object({id:z.string().regex(/^[a-z\d-]{1,64}$/)}).safeParse(body);if(!parsed.success)return json({error:'Invalid product.'},400);
 const pending=await db.prepare('SELECT reserved FROM products WHERE id=?').bind(parsed.data.id).first<{reserved:number}>();if(pending?.reserved)return json({error:'This piece has reserved orders. Fulfil or cancel them before removal.'},409);await db.prepare('DELETE FROM products WHERE id=?').bind(parsed.data.id).run();return json({removed:true});
}
if(body.type==='rates'){
 const parsed=z.object({gold22k:z.number().positive().max(1000000),silver925:z.number().positive().max(100000)}).safeParse(body);if(!parsed.success)return json({error:'Enter positive numeric rates.'},400);
 await db.prepare('INSERT INTO bullion_rates (id,gold22k,silver925,updated_at) VALUES (1,?,?,?) ON CONFLICT(id) DO UPDATE SET gold22k=excluded.gold22k,silver925=excluded.silver925,updated_at=excluded.updated_at').bind(parsed.data.gold22k,parsed.data.silver925,new Date().toISOString()).run();return json({saved:true});
}
if(body.type==='lead'){
 const parsed=z.object({id:z.string().uuid(),status:z.enum(['PENDING','CONTACTED','CONFIRMED'])}).safeParse(body);if(!parsed.success)return json({error:'Invalid consultation update.'},400);
 await db.prepare('UPDATE consultation_leads SET status=? WHERE id=?').bind(parsed.data.status,parsed.data.id).run();return json({saved:true});
}
return json({error:'Unknown operation.'},400);
}catch(error){console.error(error);return json({error:'Could not save. Your changes remain in the editor.'},503);}}
