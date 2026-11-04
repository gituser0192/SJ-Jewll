import assert from 'node:assert/strict';
import {neon} from '@neondatabase/serverless';
assert.equal(process.env.NEON_BRANCH,'sheochand-neon-verify','Run fixture checks only on the Neon verification branch.');
const postgres=neon(process.env.DATABASE_URL);
const base=process.env.SJ_BASE_URL??'http://127.0.0.1:5173';assert.match(base,/^http:\/\/(127\.0\.0\.1|localhost):\d+$/,'Shop checks must run against local storage only.');
const signIn=await fetch(base+'/signin-with-chatgpt?return_to=%2Fcart',{redirect:'manual'}),cookie=signIn.headers.get('set-cookie').split(';')[0];
async function call(path,body,auth=true,origin=base){const response=await fetch(base+path,{headers:{Origin:origin,...(auth?{Cookie:cookie}:{}),...(body?{'Content-Type':'application/json'}:{})},...(body?{method:'POST',body:JSON.stringify(body)}:{})});const text=await response.text();let data;try{data=JSON.parse(text);}catch{data={error:text};}return {status:response.status,data};}
const admin=body=>call('/api/admin',body),shop=body=>call('/api/shop',body);
async function sql(command){return postgres.query(command.replace(/(FROM|INTO|UPDATE) (orders|products|cart_items)\b/g,'$1 sheochand.$2'));}
assert.equal((await call('/api/shop',undefined,false)).status,401);
assert.equal((await call('/api/shop',{action:'cart',id:'sj01',quantity:1},true,'https://wrong.example')).status,403);
for(const path of ['/cart','/orders']){const response=await fetch(base+path,{redirect:'manual'});assert.equal(response.status,307);assert.match(response.headers.get('location'),/^\/login\?next=/);}
const original=(await admin()).data.content,existing=(await shop()).data.items;assert.equal(existing.length,0,'Use an empty local test cart.');
const id='shop-qa-'+crypto.randomUUID(),category='qa-'+crypto.randomUUID().slice(0,8),orderIds=[];
let product={id,name:'Shop test jewellery',category,purity:'Test only',description:'Local commerce test fixture',image_url:'/images/earrings.avif',kind:'earrings',published:true,price_status:'On request',overlay_url:'',ar_scale:.22,ar_offset:.02,price_paise:9999,stock:2};
const content={...original,announcement:'LOCAL CMS TEST',seoTitle:'Local CMS shop test',deliveryEnabled:true,shippingPaise:12050,collections:[...original.collections,{id:category,label:'Test collection',description:'A local collection test.'}]};
function checkout(selection,extra={}){return {action:'checkout',requestKey:crypto.randomUUID(),fingerprint:selection.fingerprint,expectedTotal:selection.subtotal,fullName:'Local QA customer',phone:'0000000000',fulfilment:'pickup',address:'',notes:'Local test only',consent:true,...extra};}
try{
 assert.equal((await admin({type:'content',content:{...content,heroImage:'https://evil.example/image.png'}})).status,400);
 assert.equal((await admin({type:'content',content:{...content,collections:[content.collections[0],content.collections[0]]}})).status,400);
 assert.equal((await admin({type:'content',content:{...content,collections:[{id:'all',label:'Reserved identifier',description:''}]}})).status,400);
 assert.equal((await admin({type:'content',content})).status,200);
 let html=await(await fetch(base+'/')).text();assert.ok(html.includes('LOCAL CMS TEST'));assert.ok(html.includes('Local CMS shop test'));
 assert.equal((await admin({type:'product',product:{...product,price_paise:99.99}})).status,400);
 assert.equal((await admin({type:'product',product})).status,200);
 assert.equal((await admin({type:'content',content:original})).status,400,'Collections in use must be retained.');
 html=await(await fetch(base+'/products/'+id)).text();assert.ok(html.includes('Shop test jewellery'));assert.ok(html.includes('Add to bag'));
 assert.equal((await shop({action:'cart',id,quantity:21})).status,400);
 assert.equal((await shop({action:'cart',id,quantity:3})).status,409);
 assert.equal((await shop({action:'cart',id,quantity:1,add:true})).status,200);
 let selection=(await shop()).data;assert.equal(selection.subtotal,9999);assert.equal(selection.items[0].quantity,1);
 assert.equal((await shop(checkout(selection,{expectedTotal:1}))).status,409);
 assert.equal((await shop(checkout(selection,{fulfilment:'delivery',address:'short'}))).status,400);
 product={...product,price_paise:10000};assert.equal((await admin({type:'product',product})).status,200);
 assert.equal((await shop(checkout(selection))).status,409,'Stale cart prices must be reviewed.');
 selection=(await shop()).data;
 const payload=checkout(selection,{fulfilment:'delivery',address:'Local test address only',expectedTotal:selection.subtotal+12050});
 const placed=await shop(payload);assert.equal(placed.status,201,JSON.stringify(placed));orderIds.push(placed.data.id);
 assert.equal((await shop(payload)).data.id,placed.data.id,'Checkout retries must return the same order.');
 let order=(await call('/api/shop?id='+placed.data.id)).data.order;assert.equal(order.total_paise,22050);assert.equal(order.payment_status,'UNPAID');assert.equal(order.status,'PENDING');
 let saved=(await admin()).data.products.find(p=>p.id===id);assert.equal(saved.reserved,1);assert.equal(saved.stock,2);
 assert.equal((await admin({type:'product',product:{...product,stock:0}})).status,409);
 assert.equal((await admin({type:'remove',id})).status,409);
 assert.equal((await shop({action:'cancel',id:placed.data.id})).status,200);
 assert.equal((await shop({action:'cancel',id:placed.data.id})).status,409);
 saved=(await admin()).data.products.find(p=>p.id===id);assert.equal(saved.reserved,0);assert.equal(saved.stock,2);
 assert.equal((await shop({action:'cart',id,quantity:2})).status,200);
 selection=(await shop()).data;
 const concurrent=await Promise.all([shop(checkout(selection)),shop(checkout(selection))]);assert.equal(concurrent.filter(r=>r.status===201).length,1,'Only one checkout may reserve the remaining stock.');
 const successful=concurrent.find(r=>r.status===201).data.id;orderIds.push(successful);
 saved=(await admin()).data.products.find(p=>p.id===id);assert.equal(saved.reserved,2);assert.equal(saved.stock,2);
 assert.equal((await shop({action:'cart',id,quantity:1})).status,409);
 assert.equal((await admin({type:'order',id:successful,action:'confirm'})).status,200);
 assert.equal((await admin({type:'order',id:successful,action:'confirm'})).status,409);
 assert.equal((await shop({action:'cancel',id:successful})).status,409,'Customers cannot cancel shop-confirmed orders.');
 assert.equal((await admin({type:'order',id:successful,action:'paid'})).status,200);
 assert.equal((await admin({type:'order',id:successful,action:'cancel'})).status,409,'Paid orders must not silently release inventory.');
 assert.equal((await admin({type:'order',id:successful,action:'fulfil',tracking:'QA pickup complete'})).status,200);
 assert.equal((await admin({type:'order',id:successful,action:'fulfil'})).status,409);
 saved=(await admin()).data.products.find(p=>p.id===id);assert.equal(saved.reserved,0);assert.equal(saved.stock,0);
 order=(await call('/api/shop?id='+successful)).data.order;assert.equal(order.status,'FULFILLED');assert.equal(order.payment_status,'PAID');assert.equal(order.tracking,'QA pickup complete');
 // An order under a different owner must remain inaccessible, even with its ID.
 assert.equal((await admin({type:'product',product:{...product,stock:2}})).status,200);
 const other=crypto.randomUUID();orderIds.push(other);
 await sql(`INSERT INTO orders(id,owner_id,request_key,full_name,phone,email,fulfilment,address,notes,items,subtotal_paise,shipping_paise,total_paise,status,payment_mode,inventory_state,expires_at,created_at) SELECT '${other}','local_other_customer','${other}',full_name,phone,email,fulfilment,address,notes,items,subtotal_paise,shipping_paise,total_paise,'PENDING','REQUEST','RESERVED',expires_at,created_at FROM orders WHERE id='${successful}'`);
 assert.equal((await call('/api/shop?id='+other)).status,404);
 assert.ok(!(await shop()).data.orders.some(o=>o.id===other));
 await sql(`UPDATE orders SET expires_at='2000-01-01T00:00:00.000Z' WHERE id='${other}'`);
 await shop();const expired=(await admin()).data.orders.find(o=>o.id===other);assert.equal(expired.status,'EXPIRED');assert.equal(expired.inventory_state,'RELEASED');
 saved=(await admin()).data.products.find(p=>p.id===id);assert.equal(saved.stock,2);assert.equal(saved.reserved,0);
}finally{
 await shop({action:'cart',id,quantity:0});
 for(const orderId of orderIds){await admin({type:'order',id:orderId,action:'cancel'});await sql(`DELETE FROM orders WHERE id='${orderId}'`);}
 await admin({type:'remove',id});assert.equal((await admin({type:'content',content:original})).status,200);
}
console.log('PASS: CMS persistence and validation, protected shopping routes, price/stock checks, exact totals, delivery, idempotency, concurrent stock reservations, cancellation, fulfilment, manual payment and customer order ownership.');
