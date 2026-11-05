import AdminPortal from '@/components/storefront/admin-portal';
import OwnerVerification from '@/components/storefront/owner-verification';
import {CustomerSignOut} from '@/components/storefront/customer-auth';
import {adminUser,pendingAdminUser} from '@/lib/admin';
import {getCustomerUser} from '@/lib/auth/user';
import {chatGPTSignInPath} from '@/app/chatgpt-auth';
export const dynamic='force-dynamic';
export const metadata={title:'Shop management | Sheochand Jewellery',robots:{index:false,follow:false}};
export default async function Admin(){
 const admin=await adminUser();if(admin)return <AdminPortal account={admin.email}/>;
 const [pending,user]=await Promise.all([pendingAdminUser(),getCustomerUser()]);
 return <main className="admin-access"><a className="brand" href="/">SJ <span>SHEOCHAND<small>JEWELLERY · EST. 1964</small></span></a><div className="access-card"><p className="eyebrow">PRIVATE MAISON PORTAL</p><h1>Your shop,<br/><em>beautifully managed.</em></h1>{pending?<OwnerVerification email={pending.email}/>:<><p>{user?`You are signed in as ${user.email}. This account does not have shop-management access.`:'Sign in with your authorised owner account to manage photography, descriptions, prices, orders and website content.'}</p>{!user&&<a className="button" href="/login?next=%2Fadmin">Sign in to the admin portal</a>}</>}{user&&<CustomerSignOut returnTo="/admin"/>}{!user&&<details className="admin-legacy-access"><summary>Original owner sign-in</summary><a className="text-link" target="_top" href={chatGPTSignInPath('/admin')}>Continue with ChatGPT</a></details>}<a className="text-link" href="/">Return to the collection</a></div></main>;
}
