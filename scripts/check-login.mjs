import assert from 'node:assert/strict';
const base=process.env.SJ_BASE_URL??'http://127.0.0.1:5173';assert.match(base,/^http:\/\/(127\.0\.0\.1|localhost):\d+$/);
const guest=await fetch(base+'/try-on',{redirect:'manual'});assert.equal(guest.status,307);assert.equal(guest.headers.get('location'),'/login?next=%2Ftry-on');
const forged=await fetch(base+'/try-on',{redirect:'manual',headers:{'oai-authenticated-user-id':'forged','oai-authenticated-user-email':'hs2162943@gmail.com'}});assert.equal(forged.status,307);
const login=await(await fetch(base+'/login')).text();assert.ok(login.includes('Continue with ChatGPT'));assert.ok(login.includes('return_to=%2Ftry-on'));assert.ok(!login.includes('type="password"'));
const unsafe=await(await fetch(base+'/login?next=https%3A%2F%2Fevil.example')).text();assert.doesNotMatch(unsafe,/href="[^"]*evil\.example/);assert.ok(unsafe.includes('return_to=%2Ftry-on'));
const landing=await(await fetch(base+'/')).text();assert.ok(landing.includes('Sign in to try on'));assert.ok(!landing.includes('Start live try-on'),'Guests must only see the studio invitation, not camera controls.');
let response=await fetch(base+'/api/session');assert.equal(response.status,401);assert.equal((await response.json()).signedIn,false);assert.match(response.headers.get('cache-control'),/no-store/);
const signin=await fetch(base+'/signin-with-chatgpt?return_to=%2Ftry-on',{redirect:'manual'});assert.equal(signin.status,302);const cookie=signin.headers.get('set-cookie').split(';')[0];assert.equal(signin.headers.get('location'),'/try-on');
response=await fetch(base+'/api/session',{headers:{Cookie:cookie}});assert.equal(response.status,200);assert.equal((await response.json()).signedIn,true);
const fitting=await(await fetch(base+'/try-on',{headers:{Cookie:cookie}})).text();assert.ok(fitting.includes('Start live try-on'));assert.ok(fitting.includes('Signed in as '));assert.ok(fitting.includes('seedy@sites.test'));
const account=await(await fetch(base+'/login',{headers:{Cookie:cookie}})).text();assert.ok(account.includes('seedy@sites.test'));assert.ok(account.includes('Open live try-on'));
const after=await fetch(base+'/try-on',{redirect:'manual'});assert.equal(after.status,307,'A prior signed-in response must not be cached for another visitor.');
const signout=await fetch(base+'/signout-with-chatgpt?return_to=%2Flogin',{headers:{Cookie:cookie},redirect:'manual'});assert.equal(signout.status,302);assert.match(signout.headers.get('set-cookie'),/Max-Age=0/);
console.log('PASS: public invitation, login page, safe return destinations, guest/forged-header denial, authenticated studio, session checks, cache isolation and logout.');

