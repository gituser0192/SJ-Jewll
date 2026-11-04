import {readFileSync} from 'node:fs';
import {neon} from '@neondatabase/serverless';
import {AwsClient} from 'aws4fetch';
const tables=['products','bullion_rates','pedigrees','consultation_leads','settings','wishlists','cart_items','orders'];
const source=JSON.parse(readFileSync(process.argv[2]??'work/d1-export.json','utf8'));
const sql=neon(process.env.DATABASE_URL_UNPOOLED),s3=new AwsClient({accessKeyId:process.env.AWS_ACCESS_KEY_ID,secretAccessKey:process.env.AWS_SECRET_ACCESS_KEY,region:process.env.AWS_REGION,service:'s3'});
const marker=await sql`SELECT value FROM sheochand.settings WHERE key='d1_import_v1'`;
if(marker.length){console.log('D1 import already completed on this branch.');process.exit(0);}
for(const table of tables){const rows=await sql.query(`SELECT count(*) AS n FROM sheochand.${table}`);if(Number(rows[0].n))throw new Error('Refusing to import into nonempty table: '+table);}
const keys=new Set();
for(const rows of Object.values(source))for(const row of rows)for(const value of Object.values(row)){if(typeof value!=='string')continue;for(const match of value.matchAll(/\/media\/([a-f\d-]{36}\.(?:png|jpg|webp|avif))/g))keys.add(match[1]);}
for(const key of keys){const response=await fetch('https://sheochand-jewellery.hs2162943.chatgpt.site/media/'+key);if(!response.ok)throw new Error('Could not copy an existing photograph.');const bytes=new Uint8Array(await response.arrayBuffer());const url=process.env.AWS_ENDPOINT_URL_S3.replace(/\/$/,'')+'/assets/'+key;const written=await s3.fetch(url,{method:'PUT',body:bytes,headers:{'Content-Type':response.headers.get('content-type')??'application/octet-stream','Cache-Control':'public, max-age=31536000, immutable'}});if(!written.ok)throw new Error('Photo copy failed.');const read=await s3.fetch(url);if(!read.ok||(await read.arrayBuffer()).byteLength!==bytes.length)throw new Error('Photo copy verification failed.');}
const statements=[sql.query('ALTER TABLE sheochand.orders DISABLE TRIGGER reserve_order')];
for(const table of tables){if(!Array.isArray(source[table]))throw new Error('Missing source table: '+table);for(const row of source[table]){const columns=Object.keys(row);if(columns.some(c=>!/^[a-z_]+$/.test(c)))throw new Error('Invalid source column');statements.push(sql.query(`INSERT INTO sheochand.${table} (${columns.map(c=>'"'+c+'"').join(',')}) VALUES (${columns.map((_,i)=>'$'+(i+1)).join(',')})`,Object.values(row)));}}
statements.push(sql.query('ALTER TABLE sheochand.orders ENABLE TRIGGER reserve_order'),sql`INSERT INTO sheochand.settings(key,value) VALUES('d1_import_v1',${new Date().toISOString()})`);
await sql.transaction(statements);
for(const table of tables){const rows=await sql.query(`SELECT count(*) AS n FROM sheochand.${table}`);const expected=source[table].length+(table==='settings'?1:0);if(Number(rows[0].n)!==expected)throw new Error('Import count mismatch: '+table);console.log('Imported '+table+': '+source[table].length+' records');}
console.log('PASS: existing D1 data and '+keys.size+' referenced uploaded photographs imported.');
