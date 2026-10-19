import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const base=process.env.SJ_BASE_URL??'http://127.0.0.1:5173';assert.match(base,/^http:\/\/(127\.0\.0\.1|localhost):\d+$/,'Use a local preview only.');
let auth='';
async function call(path,body,loggedIn=true,extra={}){const response=await fetch(base+path,{method:body?'POST':'GET',headers:{Origin:base,...(loggedIn&&auth?{Cookie:auth}:{}),...(body?{'Content-Type':'application/json'}:{}),...extra},...(body?{body:JSON.stringify(body)}:{})});return {status:response.status,data:await response.json()};}
assert.equal((await call('/api/admin',undefined,false)).status,403);
assert.equal((await call('/api/admin',undefined,false,{'oai-authenticated-user-id':'forged','oai-authenticated-user-email':'seedy@sites.test'})).status,403,'Raw identity headers must be stripped by local auth boundary.');
const signin=await fetch(base+'/signin-with-chatgpt?return_to=%2Fadmin',{redirect:'manual'});assert.equal(signin.status,302);auth=signin.headers.get('set-cookie').split(';')[0];
const collection=await call('/api/catalog');assert.equal(collection.status,200);assert.ok(collection.data.products.every(p=>p.published===1));assert.ok(collection.data.products.some(p=>p.overlay_url));
const gate=await(await fetch(base+'/admin')).text();assert.ok(gate.includes('Sign in to the admin portal'));const portal=await(await fetch(base+'/admin',{headers:{Cookie:auth}})).text();assert.ok(portal.includes('Add a piece'));assert.ok(!portal.includes('Product JSON'));const admin=await call('/api/admin');assert.equal(admin.status,200);assert.equal(admin.data.account,'seedy@sites.test');
const wishlistCookie='sj_visitor='+crypto.randomUUID();
const product={id:'qa-'+crypto.randomUUID(),name:'Local test piece',category:'flora-fauna',purity:'QA only',description:'Visible description test',image_url:'/images/earrings.avif',kind:'earrings',price_status:'On request',published:false,overlay_url:'',ar_scale:.22,ar_offset:.02};
try{
 assert.equal((await call('/api/admin',{type:'product',product},false)).status,403);
 assert.equal((await call('/api/admin',{type:'product',product:{...product,image_url:'https://bad.example/x.png'}})).status,400);
 assert.equal((await call('/api/admin',{type:'product',product})).status,200);
 assert.ok(!(await call('/api/catalog')).data.products.some(p=>p.id===product.id),'Drafts must not appear in the public catalogue.');
 assert.ok((await call('/api/admin')).data.products.some(p=>p.id===product.id));
 product.published=true;product.description='Edited description below the photo';assert.equal((await call('/api/admin',{type:'product',product})).status,200);
 assert.equal((await call('/api/catalog')).data.products.find(p=>p.id===product.id).description,product.description);
 assert.equal((await call('/api/admin',{type:'product',product:{...product,image_url:''}})).status,400,'Published products need a photo.');
 const saved=await fetch(base+'/api/wishlist',{method:'POST',headers:{Origin:base,Cookie:wishlistCookie,'Content-Type':'application/json'},body:JSON.stringify({items:[product.id]})});assert.equal(saved.status,200);product.published=false;product.image_url='';assert.equal((await call('/api/admin',{type:'product',product})).status,200,'A photo may be removed from a draft.');
 const uploadBytes=readFileSync('public/tryon/botanical-drop.png');
 const uploaded=await fetch(base+'/api/admin/upload',{method:'POST',headers:{Origin:base,Cookie:auth,'Content-Type':'image/png','X-Upload-Purpose':'overlay'},body:uploadBytes});const upload=await uploaded.json();assert.equal(uploaded.status,200,JSON.stringify(upload));assert.match(upload.url,/^\/media\//);
 assert.equal((await fetch(base+'/api/admin/upload',{method:'POST',headers:{Origin:base,'Content-Type':'image/png'},body:uploadBytes})).status,403);product.image_url=upload.url;product.overlay_url=upload.url;product.published=true;assert.equal((await call('/api/admin',{type:'product',product})).status,200);assert.equal((await call('/api/catalog')).data.products.find(p=>p.id===product.id).image_url,upload.url);const image=await fetch(base+upload.url);assert.equal(image.status,200);assert.equal(image.headers.get('content-type'),'image/png');assert.equal((await image.arrayBuffer()).byteLength,readFileSync('public/tryon/botanical-drop.png').length);
 const bad='<svg><script>alert(1)</script></svg>';assert.equal((await fetch(base+'/api/admin/upload',{method:'POST',headers:{Origin:base,Cookie:auth,'Content-Type':'image/svg+xml'},body:bad})).status,400);
 const csrf=await fetch(base+'/api/admin',{method:'POST',headers:{Origin:'https://invalid.example',Cookie:auth,'Content-Type':'application/json'},body:JSON.stringify({type:'remove',id:product.id})});assert.equal(csrf.status,403);
}finally{assert.equal((await call('/api/admin',{type:'remove',id:product.id})).status,200);}
assert.ok(!(await call('/api/admin')).data.products.some(p=>p.id===product.id));const favourites=await(await fetch(base+'/api/wishlist',{headers:{Cookie:wishlistCookie}})).json();assert.ok(!favourites.items.includes(product.id),'Removed pieces must disappear from saved selections.');
const source=ts.transpileModule(readFileSync('lib/tryon-render.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {facePose,smoothPose,drawJewellery}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const face=Array.from({length:478},()=>({x:.5,y:.5}));face[234]={x:.4,y:.4};face[454]={x:.6,y:.4};face[152]={x:.5,y:.7};face[1]={x:.5,y:.5};const pose=facePose(face,1000,800);assert.ok(Math.abs(pose.width-200)<.001);assert.equal(pose.roll,0);assert.equal(facePose([],1000,800),null);assert.equal(smoothPose(pose,{...pose,x:600},.5).x,550);
let draws=0;const context={save(){},restore(){},translate(){},rotate(){},scale(){},drawImage(){draws++;}};drawJewellery(context,{width:100,height:160},pose,'earrings',.22,.02);assert.equal(draws,2);draws=0;drawJewellery(context,{width:160,height:100},pose,'necklace',1.65,.07);assert.equal(draws,1);
console.log('PASS: account authorisation, forged-header denial, product create/edit/delete, draft visibility, photo removal, R2 upload/read, unsafe-file rejection, CSRF, face-fit geometry and photographic rendering.');
