export function loginEvent(path:string,status:number,body:unknown){
 if(status!==200||!['sign-in/email','sign-up/email'].includes(path)||!body||typeof body!=='object')return null;
 const user=(body as {user?:{id?:unknown}}).user;
 if(!user||typeof user.id!=='string'||!/^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i.test(user.id))return null;
 return {userId:'neon:'+user.id,kind:path==='sign-in/email'?'signin':'signup'};
}
