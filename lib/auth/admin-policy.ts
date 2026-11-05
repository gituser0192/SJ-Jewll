type OwnerIdentity={id:string;email:string;emailVerified?:boolean};
export function isPinnedOwner(user:OwnerIdentity|null|undefined,email:string|undefined,id:string|undefined){return !!(user&&id?.trim()&&email?.trim()&&user.id===id.trim()&&user.email.trim().toLowerCase()===email.trim().toLowerCase());}
export function canManageShop(user:OwnerIdentity|null|undefined,email:string|undefined,id:string|undefined){return isPinnedOwner(user,email,id)&&user?.emailVerified===true;}
