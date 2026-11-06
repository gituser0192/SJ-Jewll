import type {Landmark} from './tryon-render.ts';
export type Anchor='necklace'|'earrings'|'bracelet'|'ring'|'payal';
export type BodyPose={x:number;y:number;width:number;angle:number;flatten:number};
export function bodyAnchor(kind:string):Anchor|null{if(['necklace','chain','mangalsutra'].includes(kind))return 'necklace';return ['earrings','bracelet','ring','payal'].includes(kind)?kind as Anchor:null;}
export const trackerFor=(anchor:Anchor)=>anchor==='bracelet'||anchor==='ring'?'hand':anchor==='payal'?'pose':'face';
const valid=(p:Landmark|undefined)=>!!p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=0&&p.x<=1&&p.y>=0&&p.y<=1;
export function handPose(points:Landmark[],width:number,height:number,anchor:'bracelet'|'ring',finger=3):BodyPose|null{
 if(![0,5,9,17].every(i=>valid(points[i])))return null;
 const at=(i:number)=>({x:points[i].x*width,y:points[i].y*height});const wrist=at(0),middle=at(9),index=at(5),pinky=at(17);const palm=Math.hypot(index.x-pinky.x,index.y-pinky.y),length=Math.hypot(middle.x-wrist.x,middle.y-wrist.y);if(palm<15||length<20)return null;
 if(anchor==='bracelet')return {x:wrist.x-(middle.x-wrist.x)*.12,y:wrist.y-(middle.y-wrist.y)*.12,width:palm*.85,angle:Math.atan2(middle.y-wrist.y,middle.x-wrist.x)+Math.PI/2,flatten:.38};
 const pairs=[[1,2],[5,6],[9,10],[13,14],[17,18]],pair=pairs[Math.max(0,Math.min(4,Math.round(finger)))];if(!pair.every(i=>valid(points[i])))return null;const base=at(pair[0]),joint=at(pair[1]),len=Math.hypot(joint.x-base.x,joint.y-base.y);if(len<5)return null;return {x:base.x+(joint.x-base.x)*.28,y:base.y+(joint.y-base.y)*.28,width:Math.min(palm*.32,len*.62),angle:Math.atan2(joint.y-base.y,joint.x-base.x)+Math.PI/2,flatten:1};
}
type PoseLandmark=Landmark&{visibility?:number;presence?:number};
export function anklePose(points:PoseLandmark[],width:number,height:number,side='auto'):BodyPose|null{
 const choices=(side==='left'?[[25,27]]:side==='right'?[[26,28]]:[[25,27],[26,28]]).filter(pair=>pair.every(i=>valid(points[i])&&(points[i].visibility??0)>.65&&(points[i].presence??1)>.65));
 choices.sort((a,b)=>(points[b[1]].visibility??0)-(points[a[1]].visibility??0));if(!choices.length)return null;const [ki,ai]=choices[0],k=points[ki],a=points[ai],dx=(k.x-a.x)*width,dy=(k.y-a.y)*height,len=Math.hypot(dx,dy);if(len<30)return null;return {x:a.x*width+dx*.07,y:a.y*height+dy*.07,width:len*.27,angle:Math.atan2(dy,dx)+Math.PI/2,flatten:.4};
}
export function smoothBody(previous:BodyPose|null,next:BodyPose,amount:number):BodyPose{if(!previous)return next;const delta=Math.atan2(Math.sin(next.angle-previous.angle),Math.cos(next.angle-previous.angle));return {x:previous.x+(next.x-previous.x)*amount,y:previous.y+(next.y-previous.y)*amount,width:previous.width+(next.width-previous.width)*amount,angle:previous.angle+delta*amount,flatten:next.flatten};}
export function drawBodyJewellery(ctx:CanvasRenderingContext2D,image:CanvasImageSource&{width:number;height:number},pose:BodyPose,scale:number,offset:number,rotation:number,opacity:number,brightness:number,band:boolean){
 const w=pose.width*scale,h=band?w*pose.flatten:w*image.height/image.width;ctx.save();ctx.translate(pose.x,pose.y+pose.width*offset);ctx.rotate(pose.angle+rotation*Math.PI/180);ctx.globalAlpha=opacity;ctx.filter=`brightness(${brightness}) drop-shadow(0px 1px 1px rgba(35,20,8,.22))`;
 // Only the front arc sits in front of the wrist/ankle; the back arc is hidden by the body.
 if(band){ctx.beginPath();ctx.rect(-w/2,-h*.08,w,h*.6);ctx.clip();}ctx.drawImage(image,-w/2,-h/2,w,h);ctx.restore();
}
