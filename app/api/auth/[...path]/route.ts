import {customerAuth} from '@/lib/auth/server';
import {database} from '@/db';
import {loginEvent} from '@/lib/auth/login-event';
type Context={params:Promise<{path:string[]}>};
export function GET(request:Request,context:Context){return customerAuth().handler().GET(request,context);}
export async function POST(request:Request,context:Context){
 const response=await customerAuth().handler().POST(request,context),path=(await context.params).path.join('/');
 if(response.status===200&&['sign-in/email','sign-up/email'].includes(path)){
  try{const event=loginEvent(path,response.status,await response.clone().json());if(event)await database().query('INSERT INTO sheochand.login_events(id,user_id,kind) VALUES($1,$2,$3)',[crypto.randomUUID(),event.userId,event.kind]);}
  // Reporting failure must not prevent a successful sign-in. Never log auth payloads.
  catch{console.error('Could not record sign-in activity.');}
 }
 return response;
}
export function PUT(request:Request,context:Context){return customerAuth().handler().PUT(request,context);}
export function PATCH(request:Request,context:Context){return customerAuth().handler().PATCH(request,context);}
export function DELETE(request:Request,context:Context){return customerAuth().handler().DELETE(request,context);}
