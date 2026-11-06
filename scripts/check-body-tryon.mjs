import assert from 'node:assert/strict';
import {bodyAnchor,trackerFor,handPose,anklePose,smoothBody,drawBodyJewellery} from '../lib/tryon-body.ts';
import {cleanCutout} from '../lib/tryon-cutout.ts';
for(const kind of ['chain','mangalsutra','necklace'])assert.equal(bodyAnchor(kind),'necklace');
assert.equal(bodyAnchor('artificial'),null);assert.equal(trackerFor('bracelet'),'hand');assert.equal(trackerFor('ring'),'hand');assert.equal(trackerFor('payal'),'pose');assert.equal(trackerFor('earrings'),'face');
const hand=Array.from({length:21},()=>({x:.5,y:.5}));hand[0]={x:.5,y:.7};hand[9]={x:.5,y:.4};hand[5]={x:.4,y:.4};hand[17]={x:.6,y:.4};hand[13]={x:.55,y:.4};hand[14]={x:.55,y:.3};
const wrist=handPose(hand,1000,800,'bracelet');assert.ok(wrist);assert.equal(wrist.x,500);assert.ok(wrist.y>560);assert.equal(wrist.width,170);assert.equal(wrist.angle,0);
const moved=handPose(hand.map(p=>({...p,x:p.x+.1})),1000,800,'bracelet');assert.ok(Math.abs(moved.x-wrist.x-100)<.001);assert.ok(Math.abs(moved.width-wrist.width)<.001);
assert.equal(handPose([],1000,800,'bracelet'),null);assert.equal(handPose(hand.map(p=>({...p,x:2})),1000,800,'bracelet'),null);
const ring=handPose(hand,1000,800,'ring',3);assert.ok(ring.x>500&&ring.y<320);assert.ok(ring.width<wrist.width);
const legs=Array.from({length:33},()=>({x:.5,y:.5,visibility:0,presence:1}));legs[25]={x:.4,y:.4,visibility:.95,presence:.95};legs[27]={x:.4,y:.8,visibility:.95,presence:.95};const ankle=anklePose(legs,1000,800);assert.ok(ankle);assert.equal(ankle.x,400);assert.ok(ankle.y>600);assert.equal(anklePose(legs,1000,800,'right'),null);legs[27].visibility=.3;assert.equal(anklePose(legs,1000,800),null);
const nearPi={x:1,y:1,width:20,angle:Math.PI-.01,flatten:.4};const smooth=smoothBody(nearPi,{...nearPi,angle:-Math.PI+.01},.5);assert.ok(Math.abs(smooth.angle-Math.PI)<.001);
const calls=[];const ctx={save(){},restore(){},translate(...args){calls.push(['translate',...args]);},rotate(){},beginPath(){},rect(){},clip(){calls.push(['clip']);},drawImage(...args){calls.push(['draw',...args]);}};drawBodyJewellery(ctx,{width:100,height:100},wrist,1,0,0,1,1,true);assert.ok(calls.some(c=>c[0]==='clip'));assert.deepEqual(calls[0],['translate',wrist.x,wrist.y]);
const w=100,h=100,pixels=new Uint8ClampedArray(w*h*4);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const d=Math.hypot(x-50,y-50),i=(y*w+x)*4;pixels.set(d>25&&d<32?[210,158,45,255]:[35,115,105,255],i);}
const cleaned=cleanCutout(pixels,w,h,true);assert.equal(cleaned[(50*w+50)*4+3],0,'Remove cloth inside the bracelet hole');assert.equal(cleaned[3],0,'Remove outer cloth');assert.equal(cleaned[(50*w+80)*4+3],255,'Preserve gold chain');assert.equal(pixels[3],255,'Do not mutate the catalogue photo');assert.throws(()=>cleanCutout(pixels,w,h,false),/transparent/);
const opaque=new Uint8ClampedArray(w*h*4);for(let i=0;i<opaque.length;i+=4)opaque.set([125,95,60,255],i);assert.throws(()=>cleanCutout(opaque,w,h,true),/transparent/);
console.log('PASS: wrist/finger/ankle anchors, movement and scale, missing-body rejection, visibility, angle smoothing, front-band occlusion, and bracelet background/hole cleanup.');
