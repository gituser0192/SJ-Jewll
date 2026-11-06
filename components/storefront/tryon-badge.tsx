import {Camera} from 'lucide-react';
import {tryOnPath,trackedTryOn} from '@/lib/tryon-options';
import type {Product} from '@/lib/catalog';
export default function TryOnBadge({product}:{product:Product}){return <a className="live-tryon-badge" href={tryOnPath(product.id)} aria-label={'Live try-on: '+product.name} title={trackedTryOn(product)?'Body-tracked try-on; clean artwork required':'Choose where this jewellery is worn'}><Camera size={12}/><span>Live try-on</span></a>;}
