import {createNeonAuth} from '@neon/auth/next/server';
import {env} from 'cloudflare:workers';
export function customerAuth(){
 const config=env as unknown as Record<string,string|undefined>;
 if(!config.NEON_AUTH_BASE_URL||!config.NEON_AUTH_COOKIE_SECRET)throw new Error('Customer authentication is not configured.');
 return createNeonAuth({baseUrl:config.NEON_AUTH_BASE_URL,cookies:{secret:config.NEON_AUTH_COOKIE_SECRET,sessionDataTtl:1}});
}

