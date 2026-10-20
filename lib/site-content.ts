import {z} from 'zod';
import {imagePath} from './product-input';
const short=z.string().trim().max(180),paragraph=z.string().trim().max(3000);
export const contentSchema=z.object({
 brandName:z.string().trim().min(2).max(60),monogram:z.string().trim().min(1).max(4),tagline:short,seoTitle:short,seoDescription:z.string().trim().max(300),announcement:short,
 heroEyebrow:short,heroTitle:short,heroAccent:short,heroDescription:paragraph,heroImage:imagePath,heroImageAlt:short,heroCaption:short,
 collectionEyebrow:short,collectionTitle:short,collectionAccent:short,collectionDescription:paragraph,catalogueNote:paragraph,
 legacyEyebrow:short,legacyTitle:short,legacyAccent:short,legacyDescription:paragraph,legacyStory:paragraph,legacyImage:imagePath,legacyImageAlt:short,
 contactTitle:short,contactAccent:short,contactDescription:paragraph,whatsapp:z.string().regex(/^\d{10,15}$/),address:paragraph,hours:paragraph,email:z.union([z.literal(''),z.string().email().max(180)]),footerLine:short,
 shippingPolicy:paragraph,returnsPolicy:paragraph,privacyPolicy:paragraph,
 checkoutMode:z.literal('request'),deliveryEnabled:z.boolean(),shippingPaise:z.number().int().min(0).max(1000000),checkoutNote:paragraph,
 collections:z.array(z.object({id:z.string().regex(/^[a-z][a-z\d-]{0,39}$/),label:z.string().trim().min(2).max(60),description:z.string().trim().max(300)})).min(1).max(12)
}).refine(c=>new Set(c.collections.map(x=>x.id)).size===c.collections.length,{message:'Collection identifiers must be unique.'}).refine(c=>c.collections.every(x=>x.id!=='all'),{message:'Choose a collection identifier other than all.'});
export type SiteContent=z.infer<typeof contentSchema>;
export const defaultContent:SiteContent={
 brandName:'Sheochand',monogram:'SJ',tagline:'JEWELLERY · EST. 1964',seoTitle:'Sheochand Jewellery | Since 1964',seoDescription:'Three generations of independent craftsmanship. Explore the collection and arrange your personal consultation.',announcement:'INDEPENDENT SINCE 1964 · TODAY’S BULLION RATES: PLEASE ENQUIRE',
 heroEyebrow:'THREE GENERATIONS. ONE EXTRAORDINARY LEGACY.',heroTitle:'Some things\nare forever.',heroAccent:'Make them yours.',heroDescription:'Jewellery for the moments that become memories.\nCrafted with care. Treasured for generations.',heroImage:'/images/pendant.avif',heroImageAlt:'Layered gold chains with a deep teal gemstone pendant',heroCaption:'THE ART OF EVERYDAY EXCEPTIONAL',
 collectionEyebrow:'THE SHEOCHAND EDIT',collectionTitle:'A lifetime of',collectionAccent:'beautiful choices.',collectionDescription:'From the everyday to the once in a lifetime.\nFind the piece that feels like you.',catalogueNote:'An illustrative edit using the supplied photographs. Names, collection categories and materials await shop verification; hallmark and purity are confirmed on enquiry.',
 legacyEyebrow:'A HOUSE BUILT ON TRUST',legacyTitle:'Trends come and go.',legacyAccent:'Our promise stays.',legacyDescription:'Since 1964, Sheochand Jewellery has carried one belief through three generations: the finest jewellery is personal.',legacyStory:'An independent house where heritage meets your story. Whether it is a first keepsake, a wedding celebration or an heirloom for the next generation, we invite you to make it meaningful.',legacyImage:'/images/necklace.avif',legacyImageAlt:'A pearl necklace resting in its presentation box',
 contactTitle:'Your story.',contactAccent:'Our craft.',contactDescription:'A wedding, a milestone or simply something beautiful.\nTell us what you have in mind.',whatsapp:'917027653802',address:'',hours:'',email:'',footerLine:'Crafted for today. Treasured forever.',shippingPolicy:'',returnsPolicy:'',privacyPolicy:'',checkoutMode:'request',deliveryEnabled:false,shippingPaise:0,checkoutNote:'Orders are requests until the shop confirms availability and payment arrangements.',
 collections:[{id:'gold',label:'Gold treasures',description:''},{id:'silver',label:'Pure silver',description:''},{id:'bespoke',label:'Bespoke sets',description:''},{id:'flora-fauna',label:'Flora & fauna',description:''}]
};
export const contentGroups=[
 {title:'Brand & search results',keys:['brandName','monogram','tagline','seoTitle','seoDescription','announcement']},
 {title:'Homepage banner',keys:['heroEyebrow','heroTitle','heroAccent','heroDescription','heroImage','heroImageAlt','heroCaption']},
 {title:'Collection introduction',keys:['collectionEyebrow','collectionTitle','collectionAccent','collectionDescription','catalogueNote']},
 {title:'Your legacy',keys:['legacyEyebrow','legacyTitle','legacyAccent','legacyDescription','legacyStory','legacyImage','legacyImageAlt']},
 {title:'Contact & footer',keys:['contactTitle','contactAccent','contactDescription','whatsapp','address','hours','email','footerLine']},
 {title:'Customer policies',keys:['shippingPolicy','returnsPolicy','privacyPolicy']}
] as const;
