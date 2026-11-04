import {AwsClient} from 'aws4fetch';
import {env} from 'cloudflare:workers';
export function photoStorage(){
 const config=env as unknown as Record<string,string|undefined>;
 const {AWS_ACCESS_KEY_ID:accessKeyId,AWS_SECRET_ACCESS_KEY:secretAccessKey,AWS_ENDPOINT_URL_S3:endpoint,AWS_REGION:region}=config;
 if(!accessKeyId||!secretAccessKey||!endpoint||!region)throw new Error('Neon Object Storage is not configured');
 return {client:new AwsClient({accessKeyId,secretAccessKey,region,service:'s3'}),endpoint:endpoint.replace(/\/$/,'')};
}
export async function uploadPhoto(key:string,bytes:Uint8Array,contentType:string,purpose:string){
 const {client,endpoint}=photoStorage();
 const response=await client.fetch(endpoint+'/assets/'+encodeURIComponent(key),{method:'PUT',body:bytes as Uint8Array<ArrayBuffer>,headers:{'Content-Type':contentType,'Cache-Control':'public, max-age=31536000, immutable','x-amz-meta-purpose':purpose}});
 if(!response.ok)throw new Error('Neon photo upload returned '+response.status);
}
export async function readPhoto(key:string){
 const {client,endpoint}=photoStorage(),response=await client.fetch(endpoint+'/assets/'+encodeURIComponent(key));
 if(response.status===404)return null;
 if(!response.ok)throw new Error('Neon photo read returned '+response.status);
 return response;
}
