import {cache} from 'react';
import {database} from '@/db';
import {contentSchema,defaultContent} from './site-content';
export const getSiteContent=cache(async()=>{const row=await database().prepare('SELECT value FROM settings WHERE key=?').bind('site_content').first<{value:string}>();return row?contentSchema.parse({...defaultContent,...JSON.parse(row.value)}):defaultContent;});
