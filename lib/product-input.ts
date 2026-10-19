import {z} from 'zod';
export const imagePath=z.string().regex(/^(\/images\/[a-z\d-]+\.avif|\/tryon\/[a-z\d-]+\.png|\/media\/[a-f\d-]{36}\.(png|jpg|webp|avif))$/);
export const productInput=z.object({id:z.string().regex(/^[a-z\d-]{1,64}$/),name:z.string().trim().min(2).max(100),category:z.enum(['gold','silver','bespoke','flora-fauna']),purity:z.string().trim().max(200),description:z.string().trim().min(1).max(1000),image_url:z.union([imagePath,z.literal('')]),kind:z.enum(['necklace','earrings','ring']),price_status:z.string().trim().min(1).max(100),published:z.boolean(),overlay_url:z.union([z.literal(''),z.string().regex(/^(\/tryon\/[a-z\d-]+\.png|\/media\/[a-f\d-]{36}\.png)$/)]),ar_scale:z.number().min(.1).max(3),ar_offset:z.number().min(-.5).max(1)}).refine(p=>!p.published||!!p.image_url,{message:'A published piece needs a photograph.'}).refine(p=>p.kind!=='ring'||!p.overlay_url,{message:'Face tracking supports necklaces and earrings. Remove the ring overlay.'});
export function imageFormat(bytes:Uint8Array){
  if(bytes.length<32)return null;
  if([137,80,78,71,13,10,26,10].every((n,i)=>bytes[i]===n))return {extension:'png',type:'image/png'};
  if(bytes[0]===255&&bytes[1]===216&&bytes[2]===255)return {extension:'jpg',type:'image/jpeg'};
  const text=new TextDecoder().decode(bytes.slice(0,32));
  if(text.startsWith('RIFF')&&text.slice(8,12)==='WEBP')return {extension:'webp',type:'image/webp'};
  if(text.slice(4,8)==='ftyp'&&/avif|avis/.test(text.slice(8)))return {extension:'avif',type:'image/avif'};
  return null;
}
