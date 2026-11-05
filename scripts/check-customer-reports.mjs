import assert from 'node:assert/strict';
import {loginEvent} from '../lib/auth/login-event.ts';
import {customerStatsSql,customerDirectorySql} from '../lib/admin-reports-sql.ts';
const id='ccfde28b-659b-4c1f-a9a5-ea7f65fd2c44',body={user:{id,email:'private@example.invalid',name:'Private name'},token:'must-never-be-recorded'};
assert.deepEqual(loginEvent('sign-in/email',200,body),{userId:'neon:'+id,kind:'signin'});
assert.deepEqual(loginEvent('sign-up/email',200,body),{userId:'neon:'+id,kind:'signup'});
for(const path of ['get-session','email-otp/verify-email','sign-out','sign-in/social'])assert.equal(loginEvent(path,200,body),null);
for(const status of [400,401,403,500])assert.equal(loginEvent('sign-in/email',status,body),null);
for(const value of [null,{}, {user:{id:'not-a-uuid'}},{user:{id:'________-____-____-____-____________'}}])assert.equal(loginEvent('sign-in/email',200,value),null);
assert.ok(!JSON.stringify(loginEvent('sign-in/email',200,body)).includes('private'));
for(const sql of [customerStatsSql,customerDirectorySql]){assert.doesNotMatch(sql,/\b(token|password|ipAddress|userAgent)\b/i);assert.match(sql,/<>\$1/);}
assert.match(customerDirectorySql,/LIMIT 25 OFFSET \$4/);
console.log('PASS: successful sign-ins/signup distinguished, failed logins and session refreshes excluded, credentials omitted, owner excluded and customer reports paginated.');
