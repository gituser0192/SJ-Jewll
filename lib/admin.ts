import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '@/app/chatgpt-auth';
export async function adminUser(){
  const user=await getChatGPTUser();
  const email=(env as unknown as Record<string,string|undefined>).ADMIN_EMAIL?.trim().toLowerCase();
  return user&&email&&user.email.toLowerCase()===email?user:null;
}
export async function limitedBody(request:Request,maxBytes:number){
  if(Number(request.headers.get('content-length')??0)>maxBytes)throw new Error('Upload exceeds the size limit.');
  const reader=request.body?.getReader();if(!reader)return new Uint8Array();
  const chunks:Uint8Array[]=[];let size=0;
  while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>maxBytes){await reader.cancel();throw new Error('Upload exceeds the size limit.');}chunks.push(value);}
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}return bytes;
}
export function sameOrigin(request:Request){return request.headers.get('origin')===new URL(request.url).origin;}
