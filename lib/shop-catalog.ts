import type {Product} from './catalog';
export type ShopFilters={q:string;category:string;kind:string;availability:string;sort:string};
export function filterProducts(products:Product[],filters:ShopFilters){
 const words=filters.q.trim().toLowerCase().split(/\s+/).filter(Boolean);
 const result=products.filter(p=>words.every(w=>[p.name,p.description,p.purity].join(' ').toLowerCase().includes(w))&&(filters.category==='all'||p.category===filters.category)&&(filters.kind==='all'||p.kind===filters.kind)&&(filters.availability!=='available'||(p.price_paise??0)>0&&(p.stock??0)-(p.reserved??0)>0));
 if(filters.sort==='name')result.sort((a,b)=>a.name.localeCompare(b.name));
 if(['price-asc','price-desc'].includes(filters.sort))result.sort((a,b)=>{const x=a.price_paise??0,y=b.price_paise??0;if(!x||!y)return x? -1:y?1:0;return filters.sort==='price-asc'?x-y:y-x;});
 return result;
}
