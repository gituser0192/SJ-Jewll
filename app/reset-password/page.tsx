import CustomerAuthForm from '@/components/storefront/customer-auth';
export const dynamic='force-dynamic';
export default async function Page({searchParams}:{searchParams:Promise<{token?:string;error?:string}>}){const query=await searchParams;return <CustomerAuthForm mode="reset" next="/try-on" token={typeof query.token==='string'&&query.token.length<=1024?query.token:undefined} invalidToken={!!query.error}/>;}
