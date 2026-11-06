import type {Product} from './catalog';
import {bodyAnchor} from './tryon-body.ts';
export const tryOnPath=(id:string)=>'/try-on?piece='+encodeURIComponent(id);
export const trackedTryOn=(p:Product)=>!!bodyAnchor(p.kind);
export const tryOnPieces=(products:Product[])=>products.filter(p=>p.published!==0&&!!p.image_url);
