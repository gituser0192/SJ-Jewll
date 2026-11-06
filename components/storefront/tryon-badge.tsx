import {Camera} from 'lucide-react';
import {tryOnPath,trackedTryOn} from '@/lib/tryon-options';
import type {Product} from '@/lib/catalog';
export default function TryOnBadge({product}:{product:Product}){return <a className="live-tryon-badge" href={tryOnPath(product.id)} aria-label={'Live try-on: '+product.name} title={trackedTryOn(product)?'Face-tracked camera filter':'Manual camera placement preview'}><Camera size={12}/><span>Live try-on</span></a>;}
