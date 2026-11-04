import {getCustomerUser} from '@/lib/auth/user';
import {redirect} from 'next/navigation';
import {ShoppingBag} from '@/components/storefront/shop';
export const dynamic='force-dynamic';
export const metadata={title:'Checkout | Sheochand Jewellery',robots:{index:false,follow:false}};
export default async function Page(){const user=await getCustomerUser();if(!user)redirect('/login?next=%2Fcheckout');return <ShoppingBag name={user.fullName??''} email={user.email} checkout/>;}
