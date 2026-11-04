import {customerAuth} from '@/lib/auth/server';
type Context={params:Promise<{path:string[]}>};
export function GET(request:Request,context:Context){return customerAuth().handler().GET(request,context);}
export function POST(request:Request,context:Context){return customerAuth().handler().POST(request,context);}
export function PUT(request:Request,context:Context){return customerAuth().handler().PUT(request,context);}
export function PATCH(request:Request,context:Context){return customerAuth().handler().PATCH(request,context);}
export function DELETE(request:Request,context:Context){return customerAuth().handler().DELETE(request,context);}
