import type {Product} from './catalog';
import {faceTryOn} from './jewellery-types.ts';
export const tryOnPath=(id:string)=>'/try-on?piece='+encodeURIComponent(id);
export const trackedTryOn=(p:Product)=>faceTryOn(p.kind)&&!!p.overlay_url;
export const tryOnPieces=(products:Product[])=>products.filter(p=>p.published!==0&&!!p.image_url);
export function manualPlacement(width:number,height:number,imageWidth:number,imageHeight:number,scale:number,x:number,y:number){const w=width*.3*scale;return {x:width*x,y:height*y,width:w,height:w*imageHeight/Math.max(1,imageWidth)};}
