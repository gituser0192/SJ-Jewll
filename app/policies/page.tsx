import {getSiteContent} from '@/lib/site-content-server';
import {ShopFrame} from '@/components/storefront/shop';
export const dynamic='force-dynamic';
export default async function Page(){const c=await getSiteContent();return <ShopFrame><h1>Shop policies.</h1>{[['Shipping & pickup',c.shippingPolicy],['Returns & exchanges',c.returnsPolicy],['Privacy',c.privacyPolicy]].map(([title,text])=><section className="policy-section" key={title}><h2>{title}</h2><p>{text||'Please contact the shop for current details before placing your order.'}</p></section>)}</ShopFrame>;}
