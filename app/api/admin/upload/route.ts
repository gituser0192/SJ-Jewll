import {uploadPhoto} from '@/lib/photo-storage';
import {adminUser,limitedBody,sameOrigin} from '@/lib/admin';
import {imageFormat} from '@/lib/product-input';
export async function POST(request:Request){try{
if(!sameOrigin(request)||!await adminUser())return Response.json({error:'Admin access required.'},{status:403});

let bytes;try{bytes=await limitedBody(request,8*1024*1024);}catch{return Response.json({error:'Choose an image smaller than 8 MB.'},{status:400});}
const format=imageFormat(bytes);if(!format)return Response.json({error:'Use a PNG, JPG, WebP or AVIF image.'},{status:400});
const overlay=request.headers.get('x-upload-purpose')==='overlay';if(overlay&&format.extension!=='png')return Response.json({error:'Try-on cutouts must be transparent PNG files.'},{status:400});
const key=crypto.randomUUID()+'.'+format.extension;await uploadPhoto(key,bytes,format.type,overlay?'overlay':'catalogue');
return Response.json({url:'/media/'+key},{headers:{'Cache-Control':'no-store'}});
}catch(error){console.error(error);return Response.json({error:'Upload failed. Please try again.'},{status:503});}}
