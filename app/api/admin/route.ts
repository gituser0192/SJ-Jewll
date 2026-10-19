import {adminUser,limitedBody,sameOrigin} from '@/lib/admin';
import {database} from '@/db';
import {productInput} from '@/lib/product-input';
import {z} from 'zod';
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'private, no-store'}});
export async function GET(){try{const user=await adminUser();if(!user)return json({error:'Sign in with the authorised admin account.'},403);const db=database();const [products,leads,rate]=await Promise.all([db.prepare('SELECT * FROM products ORDER BY id').all(),db.prepare('SELECT * FROM consultation_leads ORDER BY created_at DESC LIMIT 200').all(),db.prepare('SELECT * FROM bullion_rates WHERE id=1').first()]);return json({account:user.email,products:products.results,leads:leads.results,rate});}catch(error){console.error(error);return json({error:'The shop desk is temporarily unavailable.'},503);}}
export async function POST(request:Request){try{
if(!sameOrigin(request))return json({error:'Request origin rejected.'},403);
if(!await adminUser())return json({error:'Sign in with the authorised admin account.'},403);
let body;try{body=JSON.parse(new TextDecoder().decode(await limitedBody(request,16000)));}catch{return json({error:'Invalid or oversized request.'},400);}const db=database();
if(body.type==='product'){
  const parsed=productInput.safeParse(body.product);if(!parsed.success)return json({error:parsed.error.issues[0]?.message??'Check the product fields.'},400);
  const p=parsed.data;
  await db.prepare('INSERT INTO products (id,name,category,purity,description,image_url,kind,price_status,published,overlay_url,ar_scale,ar_offset) VALUES (?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,category=excluded.category,purity=excluded.purity,description=excluded.description,image_url=excluded.image_url,kind=excluded.kind,price_status=excluded.price_status,published=excluded.published,overlay_url=excluded.overlay_url,ar_scale=excluded.ar_scale,ar_offset=excluded.ar_offset').bind(p.id,p.name,p.category,p.purity,p.description,p.image_url,p.kind,p.price_status,p.published?1:0,p.overlay_url,p.ar_scale,p.ar_offset).run();return json({saved:true,id:p.id});
}
if(body.type==='remove'){
 const parsed=z.object({id:z.string().regex(/^[a-z\d-]{1,64}$/)}).safeParse(body);if(!parsed.success)return json({error:'Invalid product.'},400);
 await db.prepare('DELETE FROM products WHERE id=?').bind(parsed.data.id).run();return json({removed:true});
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
