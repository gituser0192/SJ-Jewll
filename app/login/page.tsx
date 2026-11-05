import {getCustomerUser} from '@/lib/auth/user';
import {chatGPTSignInPath} from '@/app/chatgpt-auth';
import {customerReturnPath} from '@/lib/auth/return-path';
import {adminUser} from '@/lib/admin';
import CustomerAuthForm,{CustomerAuthLayout,CustomerSignOut} from '@/components/storefront/customer-auth';
import {Camera,ShoppingBag,Package,ArrowRight} from 'lucide-react';
export const dynamic='force-dynamic';
export default async function Login({searchParams}:{searchParams:Promise<{next?:string;view?:string}>}){
 const query=await searchParams,next=customerReturnPath(query.next),user=await getCustomerUser();
 if(!user||query.view==='signin')return <CustomerAuthForm mode="signin" next={next} legacyHref={chatGPTSignInPath(next)}/>;
 const isAdmin=!!await adminUser();
 return <CustomerAuthLayout><p className="eyebrow">YOUR PERSONAL SHEOCHAND ACCOUNT</p><h2>A pleasure to see you.</h2><p className="auth-intro">You’re signed in as</p><p className="auth-account-name">{user.displayName}</p><p className="auth-account-email">{user.email}</p><a className="button auth-submit" href={next}>{next==='/'?'Explore the collection':next==='/cart'?'Open shopping bag':next==='/orders'?'View your orders':next==='/checkout'?'Continue to checkout':next==='/try-on'?'Open live try-on':next==='/admin'?'Open admin panel':'Continue shopping'}<ArrowRight size={17}/></a><div className="auth-account-links"><a href="/orders"><Package size={18}/> Your orders <ArrowRight size={15}/></a><a href="/cart"><ShoppingBag size={18}/> Your shopping bag <ArrowRight size={15}/></a><a href="/try-on"><Camera size={18}/> Your camera fitting <ArrowRight size={15}/></a>{isAdmin&&<a href="/admin">Manage the shop <ArrowRight size={15}/></a>}</div><CustomerSignOut/><a className="auth-back" href={'/login?view=signin&next='+encodeURIComponent(next)}>Use another account</a></CustomerAuthLayout>;
}
