import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const base=process.env.SJ_BASE_URL??'http://127.0.0.1:5173';
assert.match(base,/^http:\/\/(127\.0\.0\.1|localhost):\d+$/,'Checks must use the local preview to avoid real SMS and payment services.');
let cookie='';
async function request(path,body,headers={}){const response=await fetch(base+'/api/'+path,{method:body?'POST':'GET',headers:{Origin:base,...(body?{'Content-Type':'application/json'}:{}),...(cookie?{Cookie:cookie}:{}),...headers},...(body?{body:JSON.stringify(body)}:{})});const setCookie=response.headers.get('set-cookie');if(setCookie)cookie=setCookie.split(';')[0];return {status:response.status,data:await response.json()};}
const catalogue=await request('catalog');assert.equal(catalogue.status,200);assert.equal(catalogue.data.products.length,6);
assert.equal((await request('wishlist',{items:['sj-01']})).status,200);assert.deepEqual((await request('wishlist')).data.items,['sj-01']);assert.equal((await request('wishlist',{items:['unknown']})).status,400);assert.deepEqual((await request('wishlist')).data.items,['sj-01']);await request('wishlist',{items:[]});
const cert=await request('pedigree?code=SJ-2036-POLKI-8842');assert.equal(cert.status,200);assert.equal(cert.data.simulation,true);assert.match(cert.data.digest,/^[a-f\d]{64}$/);assert.equal((await request('pedigree?code=not-real')).status,404);
assert.equal((await request('consultations',{fullName:'A',phone:'bad',interest:'Test',consent:true})).status,400);
assert.equal((await request('consultations',{fullName:'Local QA',phone:'0000000000',interest:'QA only',prefDate:'2027-02-31',consent:true})).status,400);
const lead=await request('consultations',{fullName:'Local QA',phone:'0000000000',interest:'QA only',message:'Fabricated local smoke test',consent:true});assert.equal(lead.status,201);assert.equal(lead.data.status,'PENDING');assert.equal(lead.data.smsSent,false);
assert.equal((await request('admin')).status,403);assert.equal((await request('admin',{type:'rates',gold22k:1,silver925:1})).status,403);
const guide=await request('concierge',{message:'Tell me about the heritage'});assert.equal(guide.status,200);assert.equal(guide.data.mode,'guide');assert.match(guide.data.answer,/1964/);
assert.equal((await request('deposit',{leadId:lead.data.id})).status,503);
const rejected=await fetch(base+'/api/wishlist',{method:'POST',headers:{Origin:'https://invalid.example','Content-Type':'application/json'},body:JSON.stringify({items:[]})});assert.equal(rejected.status,403);
console.log('PASS: catalogue, persistent wishlist, sample certificates, consultation validation/save, guide, disabled deposits, admin protection and request-origin check.');

