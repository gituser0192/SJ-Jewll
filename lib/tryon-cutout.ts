// Conservative colour-keying for simple coloured/dark backdrops. Complex photos need a shop-prepared PNG.
export function cleanCutout(source:Uint8ClampedArray,width:number,height:number,allowBackgroundRemoval:boolean){
 const pixels=new Uint8ClampedArray(source),count=width*height;if(!count)throw Error('Empty jewellery image.');
 let transparent=0,solid=0,edgeClear=0,edgeCount=0;const rim:number[]=[];
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){const i=(y*width+x)*4,a=pixels[i+3];if(a<16)transparent++;if(a>32)solid++;if(x===0||y===0||x===width-1||y===height-1){edgeCount++;if(a<16)edgeClear++;rim.push(i);}}
 if(solid<count*.001)throw Error('The jewellery cutout is empty.');
 if(transparent/count>.02&&edgeClear/edgeCount>.85)return pixels;
 if(!allowBackgroundRemoval)throw Error('The try-on PNG must have a transparent background. Ask the shop to replace this cutout.');
 const hsv=(i:number)=>{const r=pixels[i]/255,g=pixels[i+1]/255,b=pixels[i+2]/255,max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min;let hue=d===0?0:max===r?((g-b)/d)%6:max===g?(b-r)/d+2:(r-g)/d+4;hue=(hue/6+1)%1;return {hue,sat:max?d/max:0,value:max};};
 const histogram=Array(24).fill(0);let dark=0;for(const i of rim){const p=hsv(i);if(p.sat>.18)histogram[Math.floor(p.hue*24)]++;if(p.value<.2)dark++;}
 let best=0;for(let h=0;h<24;h++)if(histogram[h]>histogram[best])best=h;const hue=(best+.5)/24;
 const chromatic=histogram.reduce((sum,v,h)=>sum+(Math.min(Math.abs(h-best),24-Math.abs(h-best))<=2?v:0),0)/rim.length>.6&&hue>.25&&hue<.85;
 const black=dark/rim.length>.8;if(!chromatic&&!black)throw Error('A clean transparent cutout is needed for this photograph. Ask the shop to upload its try-on PNG.');
 let kept=0,clearEdge=0;for(let y=0;y<height;y++)for(let x=0;x<width;x++){const i=(y*width+x)*4,p=hsv(i),diff=Math.min(Math.abs(p.hue-hue),1-Math.abs(p.hue-hue));if(chromatic&&p.sat>.12&&diff<.13||black&&p.value<.23)pixels[i+3]=0;if(pixels[i+3]>32)kept++;if((x===0||y===0||x===width-1||y===height-1)&&pixels[i+3]<16)clearEdge++;}
 if(kept/count<.003||kept/count>.65||clearEdge/edgeCount<.85)throw Error('Automatic cutout preparation was not reliable. Ask the shop for a transparent PNG.');return pixels;
}
