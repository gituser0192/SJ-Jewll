import CustomerAuthForm from '@/components/storefront/customer-auth';
import {customerReturnPath} from '@/lib/auth/return-path';
export const dynamic='force-dynamic';
export default async function Page({searchParams}:{searchParams:Promise<{next?:string}>}){const query=await searchParams;return <CustomerAuthForm mode="signup" next={customerReturnPath(query.next)}/>;}
