const destinations=new Set(['/','/cart','/orders','/try-on']);
export function customerReturnPath(value:unknown){return typeof value==='string'&&destinations.has(value)?value:'/try-on';}
