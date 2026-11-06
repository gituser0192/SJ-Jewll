const destinations=new Set(['/','/shop','/cart','/checkout','/orders','/try-on','/admin']);
export function customerReturnPath(value:unknown){return typeof value==='string'&&(destinations.has(value)||/^\/try-on\?piece=[a-z\d-]{1,64}$/.test(value)||/^\/products\/[a-z\d-]{1,64}$/.test(value))?value:'/try-on';}
