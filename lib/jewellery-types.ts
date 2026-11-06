export const jewelleryTypes = [
 {id:'earrings',slug:'earrings',label:'Earrings',search:'earrings earring earings jhumka jhumkas'},
 {id:'payal',slug:'payal',label:'Payal',search:'payal anklet anklets'},
 {id:'mangalsutra',slug:'mangalsutra',label:'Mangalsutra',search:'mangalsutra mangalsutar mangalsutras'},
 {id:'artificial',slug:'artificial-jewellery',label:'Artificial Jewellery',search:'artificial imitation fashion costume jewellery'},
 {id:'bracelet',slug:'bracelets',label:'Bracelets',search:'bracelet bracelets'},
 {id:'chain',slug:'chains',label:'Chains',search:'chain chains'},
 {id:'necklace',slug:'necklaces',label:'Necklaces',search:'necklace necklaces'},
 {id:'ring',slug:'rings',label:'Rings',search:'ring rings'},
] as const;
export const productKinds = ['necklace','earrings','ring','payal','mangalsutra','artificial','bracelet','chain'] as const;
export const faceTryOn = (kind:string) => ['necklace','earrings','chain','mangalsutra'].includes(kind);
