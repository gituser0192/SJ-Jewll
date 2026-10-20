import {getChatGPTUser} from '@/app/chatgpt-auth';
import {redirect} from 'next/navigation';
import {ShoppingBag} from '@/components/storefront/shop';
export const dynamic='force-dynamic';
export default async function Page(){const user=await getChatGPTUser();if(!user)redirect('/login?next=%2Fcart');return <ShoppingBag name={user.fullName??''}/>;}
