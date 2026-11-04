import {cache} from 'react';
import {database} from '@/db';
import {contentSchema,defaultContent} from './site-content';
export const getSiteContent=cache(async()=>{const row=await database().query<{value:string}>('SELECT value FROM sheochand.settings WHERE key=$1',['site_content']).then(result=>result.rows[0]??null);return row?contentSchema.parse({...defaultContent,...JSON.parse(row.value)}):defaultContent;});
