export type Landmark={x:number;y:number;z?:number};
export type Pose={x:number;y:number;width:number;roll:number;yaw:number;leftX:number;leftY:number;rightX:number;rightY:number};
export function facePose(face:Landmark[],width:number,height:number):Pose|null{
 if(!face[454]||!face[234]||!face[152]||!face[1])return null;
 const [left,right]=[face[234],face[454]].sort((a,b)=>a.x-b.x);const dx=(right.x-left.x)*width,dy=(right.y-left.y)*height;
 const size=Math.hypot(dx,dy);if(!Number.isFinite(size)||size<20)return null;
 return {x:(left.x+right.x)*width/2,y:face[152].y*height,width:size,roll:Math.atan2(dy,dx),yaw:Math.max(-.8,Math.min(.8,(face[1].x-(left.x+right.x)/2)/(Math.max(.001,right.x-left.x)/2))),leftX:left.x*width,leftY:left.y*height,rightX:right.x*width,rightY:right.y*height};
}
export function smoothPose(previous:Pose|null,next:Pose,amount:number):Pose{
 if(!previous)return next;const result={...next};for(const key of Object.keys(next) as (keyof Pose)[])result[key]=previous[key]+(next[key]-previous[key])*amount;return result;
}
export function drawJewellery(context:CanvasRenderingContext2D,image:CanvasImageSource&{width:number;height:number},pose:Pose,kind:string,scale:number,offset:number,brightness=1){
 const {width,roll,yaw}=pose;context.save();context.filter=`brightness(${brightness}) drop-shadow(0px 2px 2px rgba(35,20,8,0.24))`;
 function draw(x:number,y:number,w:number,flip=false,opacity=1){const h=w*image.height/image.width;context.save();context.translate(x,y);context.rotate(roll*.85);context.scale(flip?-1:1,1);context.globalAlpha*=opacity;context.drawImage(image,-w/2,0,w,h);context.restore();}
 if(kind==='earrings'){
  const size=width*scale;
  // Far-side earrings fade as the face turns, avoiding an obvious floating sticker.
  draw(pose.leftX-width*.025,pose.leftY+width*(.07+offset),size,false,Math.max(.12,1-Math.max(0,yaw)*1.4));
  draw(pose.rightX+width*.025,pose.rightY+width*(.07+offset),size,true,Math.max(.12,1-Math.max(0,-yaw)*1.4));
 }else{
  context.translate(pose.x+width*yaw*.07,pose.y+width*offset);context.rotate(roll*.6);context.scale(1-Math.abs(yaw)*.22,1);const w=width*scale;context.drawImage(image,-w/2,0,w,w*image.height/image.width);
 }
 context.restore();
}
