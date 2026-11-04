import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
const base=process.env.SJ_BASE_URL??'http://127.0.0.1:5173';
assert.match(base,/^http:\/\/(127\.0\.0\.1|localhost):\d+$/);
assert.equal(process.env.NEON_BRANCH,'sheochand-login-verify','Use the disposable login verification branch.');
const jar=new Map();
async function request(path,body,origin=base){const r=await fetch(base+path,{redirect:'manual',headers:{Origin:origin,...(jar.size?{Cookie:[...jar].map(([k,v])=>k+'='+v).join('; ')}:{}),...(body?{'Content-Type':'application/json'}:{})},...(body?{method:'POST',body:JSON.stringify(body)}:{})});for(const line of r.headers.getSetCookie()){const [pair]=line.split(';'),index=pair.indexOf('='),name=pair.slice(0,index),value=pair.slice(index+1);if(/max-age=0/i.test(line)||!value)jar.delete(name);else jar.set(name,value);}const text=await r.text();let data;try{data=JSON.parse(text);}catch{data={html:text};}return {status:r.status,data,location:r.headers.get('location')};}
assert.equal((await request('/api/session')).status,401);
for(const [path,copy] of [['/login','Welcome back.'],['/signup','Begin your story.'],['/forgot-password','Forgot your password?'],['/reset-password','This reset link is invalid']]){const r=await request(path);assert.equal(r.status,200);assert.ok(r.data.html.includes(copy));}
assert.equal((await request('/cart')).status,307);
const password='Sj-'+randomBytes(20).toString('base64url'),email='neon-qa-'+randomBytes(8).toString('hex')+'@example.invalid';
const signup=await request('/api/auth/sign-up/email',{name:'Login verification',email,password});assert.equal(signup.status,200,signup.data.message);assert.ok(signup.data.user?.id);
assert.equal((await request('/api/session')).data.signedIn,true);
assert.equal((await request('/cart')).status,200);
assert.equal((await request('/try-on')).status,200);
assert.equal((await request('/api/admin')).status,403,'An email signup must not grant shop-owner permissions.');
assert.ok((await request('/login')).data.html.includes(email));
console.log('PASS: email account creation, session restoration, protected bag/try-on access and admin denial.');
assert.equal((await request('/api/auth/sign-out',{})).status,200);
assert.equal((await request('/api/session')).status,401);
assert.equal((await request('/cart')).status,307);
const wrong=await request('/api/auth/sign-in/email',{email,password:'Incorrect-password-123'});assert.equal(wrong.status,401);assert.match(wrong.data.message,/invalid|incorrect/i);
const signedIn=await request('/api/auth/sign-in/email',{email,password});assert.equal(signedIn.status,200,signedIn.data.message);assert.equal((await request('/api/session')).status,200);
console.log('PASS: sign-out clears protected access, wrong passwords are rejected and email sign-in succeeds.');
await request('/api/auth/sign-out',{});
const badReset=await request('/api/auth/reset-password',{newPassword:password,token:'invalid-token'});assert.equal(badReset.status,400);
const reset=await request('/api/auth/request-password-reset',{email,redirectTo:base+'/reset-password'});assert.equal(reset.status,200,reset.data.message);
const csrf=await request('/api/auth/sign-up/email',{name:'Rejected',email:'blocked@example.invalid',password},'https://invalid.example');assert.ok([400,403].includes(csrf.status));
console.log('PASS: reset request accepted, invalid reset token rejected, and cross-origin authentication request denied. Email delivery is not asserted.');
