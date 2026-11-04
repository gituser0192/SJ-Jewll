import {neon,types} from '@neondatabase/serverless';
import {env} from 'cloudflare:workers';
// Order totals are bounded below Number.MAX_SAFE_INTEGER by the input limits.
types.setTypeParser(20,Number);
export type Statement={text:string;params:unknown[]};
export function database(){
 const url=(env as unknown as Record<string,string|undefined>).DATABASE_URL;
 if(!url)throw new Error('Neon DATABASE_URL is not configured');
 const client=neon(url,{fullResults:true});
 return {
  async query<T=Record<string,any>>(text:string,params:unknown[]=[]){const result=await client.query(text,params);return {rows:result.rows as T[],rowCount:result.rowCount};},
  transaction(statements:Statement[]){return client.transaction(statements.map(s=>client.query(s.text,s.params)));}
 };
}
