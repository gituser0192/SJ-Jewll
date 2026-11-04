import Home from '@/components/storefront/home';
import {getCustomerUser} from '@/lib/auth/user';
export const dynamic='force-dynamic';
export default async function Page(){const user=await getCustomerUser();return <Home account={user?{displayName:user.displayName,email:user.email}:null}/>;}
