import Home from '@/components/storefront/home';
import {getChatGPTUser} from './chatgpt-auth';
export const dynamic='force-dynamic';
export default async function Page(){const user=await getChatGPTUser();return <Home account={user?{displayName:user.displayName,email:user.email}:null}/>;}
