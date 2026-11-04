import CustomerAuthForm from '@/components/storefront/customer-auth';
export const dynamic='force-dynamic';
export default function Page(){return <CustomerAuthForm mode="forgot" next="/try-on"/>;}
