import {env} from 'cloudflare:workers';
import {cache} from 'react';
import {getChatGPTUser} from '@/app/chatgpt-auth';
import {customerAuth} from '@/lib/auth/server';
import {canManageShop,isPinnedOwner} from '@/lib/auth/admin-policy';
const ownerSession=cache(()=>customerAuth().getSession());
export async function pendingAdminUser(){const {data,error}=await ownerSession();if(error)throw new Error('Could not check your admin sign-in.');const config=env as unknown as Record<string,string|undefined>;return isPinnedOwner(data?.user,config.ADMIN_EMAIL,config.ADMIN_NEON_USER_ID)&&!data?.user?.emailVerified?data!.user:null;}
export async function adminUser(){
 const config=env as unknown as Record<string,string|undefined>,{data,error}=await ownerSession();
 if(error)throw new Error('Could not check your admin sign-in.');
 // An active customer session must not inherit another provider's owner access.
 if(data?.user)return canManageShop(data.user,config.ADMIN_EMAIL,config.ADMIN_NEON_USER_ID)?{userId:'neon:'+data.user.id,email:data.user.email,displayName:data.user.name||data.user.email,fullName:data.user.name||null}:null;
 const user=await getChatGPTUser(),email=config.ADMIN_EMAIL?.trim().toLowerCase();
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
