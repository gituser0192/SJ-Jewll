import {readPhoto} from '@/lib/photo-storage';
export async function GET(request:Request,{params}:{params:Promise<{key:string}>}){try{
const {key}=await params;if(!/^[a-f\d-]{36}\.(png|jpg|webp|avif)$/.test(key))return new Response('Not found',{status:404});
const object=await readPhoto(key);if(!object)return new Response('Not found',{status:404});
const headers=new Headers();headers.set('Content-Type',object.headers.get('content-type')??'application/octet-stream');headers.set('ETag',object.headers.get('etag')??'');headers.set('Cache-Control','public, max-age=31536000, immutable');headers.set('X-Content-Type-Options','nosniff');headers.set('Content-Security-Policy',"default-src 'none'; sandbox");return new Response(object.body,{headers});
}catch{return new Response('Image unavailable',{status:503});}}
