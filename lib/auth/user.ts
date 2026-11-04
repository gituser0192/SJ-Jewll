import {cache} from 'react';
import {customerAuth} from './server';
import {getChatGPTUser} from '@/app/chatgpt-auth';
export const getCustomerUser=cache(async()=>{
 const {data,error}=await customerAuth().getSession();
 if(error)throw new Error('Could not check your sign-in. Please try again.');
 if(data?.user)return {userId:'neon:'+data.user.id,email:data.user.email,displayName:data.user.name||data.user.email,fullName:data.user.name||null};
 return getChatGPTUser();
});
