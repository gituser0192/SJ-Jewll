import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {neon} from '@neondatabase/serverless';
import {AwsClient} from 'aws4fetch';
const base=process.env.SJ_BASE_URL??'http://127.0.0.1:5173';
assert.match(base,/^http:\/\/(127\.0\.0\.1|localhost):\d+$/,'Run service verification through a local app.');
for(const key of ['DATABASE_URL','AWS_ACCESS_KEY_ID','AWS_SECRET_ACCESS_KEY','AWS_ENDPOINT_URL_S3','AWS_REGION'])assert.ok(process.env[key],key+' is required');
const pg=neon(process.env.DATABASE_URL),s3=new AwsClient({accessKeyId:process.env.AWS_ACCESS_KEY_ID,secretAccessKey:process.env.AWS_SECRET_ACCESS_KEY,region:process.env.AWS_REGION,service:'s3'});
let identity={};
if(process.env.SJ_BUILT_PREVIEW==='1'){
 assert.ok(process.env.ADMIN_EMAIL,'The local owner email must be configured.');
 identity={'oai-authenticated-user-id':'neon_service_verification','oai-authenticated-user-email':process.env.ADMIN_EMAIL};
}else{
 const signin=await fetch(base+'/signin-with-chatgpt?return_to=%2Fadmin',{redirect:'manual'});assert.equal(signin.status,302);identity={Cookie:signin.headers.get('set-cookie').split(';')[0]};
}
async function admin(body){const response=await fetch(base+'/api/admin',{headers:{Origin:base,...identity,...(body?{'Content-Type':'application/json'}:{})},...(body?{method:'POST',body:JSON.stringify(body)}:{})});const data=await response.json();assert.equal(response.status,200,data.error);return data;}
const initial=await admin(),id='neon-e2e-'+crypto.randomUUID();let key,photoUrl;
try{
 const bytes=readFileSync('public/tryon/botanical-drop.png');
 const upload=await fetch(base+'/api/admin/upload',{method:'POST',headers:{Origin:base,...identity,'Content-Type':'image/png','X-Upload-Purpose':'photo'},body:bytes});assert.equal(upload.status,200,await upload.clone().text());photoUrl=(await upload.json()).url;key=photoUrl.split('/').pop();assert.match(key,/^[a-f\d-]{36}\.png$/);
 const image=await fetch(base+photoUrl);assert.equal(image.status,200);assert.match(image.headers.get('content-type'),/^image\/png/);assert.deepEqual(Buffer.from(await image.arrayBuffer()),bytes);
 const objectUrl=process.env.AWS_ENDPOINT_URL_S3.replace(/\/$/,'')+'/assets/'+key;
 const stored=await s3.fetch(objectUrl);assert.equal(stored.status,200);assert.deepEqual(Buffer.from(await stored.arrayBuffer()),bytes);
 assert.equal((await fetch(objectUrl)).status,403,'The bucket must stay private.');
 console.log('PASS: Neon Object Storage upload → app media route → exact byte match; direct signed read matches; anonymous bucket read denied.');
 const product={id,name:'Neon service verification',category:initial.content.collections[0].id,purity:'Test only',description:'Temporary verification fixture',image_url:photoUrl,kind:'earrings',price_status:'On request',published:false,overlay_url:'',ar_scale:.22,ar_offset:.02,price_paise:12345,stock:2};
 await admin({type:'product',product});let rows=await pg`SELECT image_url,description,stock,price_paise FROM sheochand.products WHERE id=${id}`;assert.equal(rows.length,1);assert.equal(rows[0].image_url,photoUrl);assert.equal(rows[0].stock,2);assert.equal(rows[0].price_paise,12345);
 await admin({type:'product',product:{...product,description:'Verified persisted update'}});rows=await pg`SELECT description FROM sheochand.products WHERE id=${id}`;assert.equal(rows[0].description,'Verified persisted update');
 assert.ok((await admin()).products.some(p=>p.id===id&&p.description==='Verified persisted update'));
 console.log('PASS: Neon Postgres create/read/update through app admin API, independently verified in sheochand.products.');
}finally{
 await admin({type:'remove',id});assert.equal((await pg`SELECT id FROM sheochand.products WHERE id=${id}`).length,0);
 if(key){const response=await s3.fetch(process.env.AWS_ENDPOINT_URL_S3.replace(/\/$/,'')+'/assets/'+key,{method:'DELETE'});assert.ok(response.ok);assert.equal((await s3.fetch(process.env.AWS_ENDPOINT_URL_S3.replace(/\/$/,'')+'/assets/'+key)).status,404);}
}
console.log('PASS: database and object-storage verification fixtures removed. Branch: '+process.env.NEON_BRANCH);
