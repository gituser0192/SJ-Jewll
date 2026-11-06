import assert from 'node:assert/strict';
import {filterProducts} from '../lib/shop-catalog.ts';
import {customerReturnPath} from '../lib/auth/return-path.ts';
const defaults={q:'',category:'all',kind:'all',availability:'all',sort:'featured'};
const pieces=[{id:'a',name:'Ruby Necklace',description:'Golden keepsake',purity:'Gold',category:'gold',kind:'necklace',price_paise:20000,stock:2,reserved:1},{id:'b',name:'Pearl Ring',description:'White pearl',purity:'Silver',category:'silver',kind:'ring',price_paise:10000,stock:1,reserved:1},{id:'c',name:'Bespoke Necklace',description:'Pearls',purity:'Details on enquiry',category:'bespoke',kind:'necklace',price_paise:0,stock:20,reserved:0}];
const ids=f=>filterProducts(pieces,{...defaults,...f}).map(p=>p.id);
assert.deepEqual(ids({q:'GOLD ruby'}),['a']);
assert.deepEqual(ids({category:'silver',kind:'ring'}),['b']);
assert.deepEqual(ids({availability:'available'}),['a']);
assert.deepEqual(ids({sort:'price-asc'}),['b','a','c']);
assert.deepEqual(ids({sort:'price-desc'}),['a','b','c']);
assert.deepEqual(ids({q:'missing'}),[]);
assert.deepEqual(pieces.map(p=>p.id),['a','b','c']);
for(const path of ['/shop','/checkout','/products/sj-01'])assert.equal(customerReturnPath(path),path);
for(const path of ['//evil.example','https://evil.example','/products/../admin','/checkout?next=bad'])assert.equal(customerReturnPath(path),'/try-on');
console.log('PASS: combined catalogue filters, unpriced sorting, reserved-stock availability, immutable input and safe shopping login destinations.');

const types=await import('../lib/jewellery-types.ts');
const categorized=types.jewelleryTypes.map(t=>({id:t.id,name:'A lovely piece',description:'Handcrafted',purity:'Specifications on enquiry',category:'gold',kind:t.id}));
for(const t of types.jewelleryTypes){
 assert.deepEqual(filterProducts(categorized,{...defaults,kind:t.id}).map(p=>p.id),[t.id]);
 assert.ok(filterProducts(categorized,{...defaults,q:t.search.split(' ').at(-1)}).some(p=>p.kind===t.id));
}
assert.deepEqual(filterProducts(categorized,{...defaults,q:'earings'}).map(p=>p.id),['earrings']);
assert.deepEqual(filterProducts(categorized,{...defaults,q:'mangalsutar'}).map(p=>p.id),['mangalsutra']);
const {productInput}=await import('../lib/product-input.ts');
const input={id:'test',name:'Test piece',category:'gold',description:'A real piece',purity:'Details on enquiry',image_url:'/images/gold.avif',price_status:'On request',published:true,overlay_url:'',ar_scale:1,ar_offset:0};
for(const kind of types.productKinds){
 assert.equal(productInput.safeParse({...input,kind}).success,true);
 assert.equal(productInput.safeParse({...input,kind,overlay_url:'/tryon/pearl-necklace.png'}).success,true);
}
assert.equal(productInput.safeParse({...input,kind:'unknown'}).success,false);
console.log('PASS: all jewellery types, category search aliases, admin validation and transparent cutout validation for every jewellery type.');
