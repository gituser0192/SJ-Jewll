import {env} from 'cloudflare:workers';
import {database} from '@/db';
import {customerStatsSql,customerDirectorySql,customerCountSql} from './admin-reports-sql';
import type {CustomerStats,CustomerProfile} from './customer-types';
function ownerParams(){const config=env as unknown as Record<string,string|undefined>;return ['neon:'+(config.ADMIN_NEON_USER_ID??''),(config.ADMIN_EMAIL??'').trim().toLowerCase()];}
export async function customerStats(){return (await database().query<CustomerStats>(customerStatsSql,ownerParams())).rows[0];}
export async function customerDirectory(q:string,page:number){const db=database(),params=[...ownerParams(),'%'+q+'%'];const [rows,count]=await Promise.all([db.query<CustomerProfile>(customerDirectorySql,[...params,(page-1)*25]),db.query<{total:number}>(customerCountSql,params)]);return {customers:rows.rows,total:count.rows[0].total,page,pageSize:25};}
