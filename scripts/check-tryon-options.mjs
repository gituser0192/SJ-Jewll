import assert from 'node:assert/strict';
import {tryOnPieces,trackedTryOn,tryOnPath} from '../lib/tryon-options.ts';
import {customerReturnPath} from '../lib/auth/return-path.ts';
const photo={id:'new-bracelet',kind:'bracelet',image_url:'/media/11111111-1111-1111-1111-111111111111.png',published:1};
assert.deepEqual(tryOnPieces([photo,{...photo,id:'draft',published:0},{...photo,id:'no-photo',image_url:''}]),[photo]);
assert.equal(trackedTryOn(photo),true);
for(const kind of ['necklace','chain','mangalsutra','earrings']){assert.equal(trackedTryOn({...photo,kind}),true);assert.equal(trackedTryOn({...photo,kind,overlay_url:'/tryon/test.png'}),true);}
for(const kind of ['ring','bracelet','payal'])assert.equal(trackedTryOn({...photo,kind,overlay_url:'/tryon/test.png'}),true);
assert.equal(trackedTryOn({...photo,kind:'artificial'}),false);
const url=tryOnPath(photo.id);assert.equal(url,'/try-on?piece=new-bracelet');assert.equal(customerReturnPath(url),url);
for(const bad of ['/try-on?piece=//evil','/try-on?piece=x&next=https://evil','/try-on?piece=../admin'])assert.equal(customerReturnPath(bad),'/try-on');
console.log('PASS: automatic published-photo inclusion, body-specific tracking modes, selected-piece login safety.');