import assert from 'node:assert/strict';
const base=process.env.SJ_BASE_URL??'http://127.0.0.1:5173';
assert.match(base,/^http:\/\/(127\.0\.0\.1|localhost):\d+$/);
const response=await fetch(base+'/@vite/client');assert.equal(response.status,200);
const client=await response.text();const options=client.match(/const forwardConsole = (\{[^;]+\});/);
assert.ok(options,'Vite must serve resolved forwarding options');assert.equal(JSON.parse(options[1]).enabled,false,'Disconnects must not trigger console-forwarding rejection loops');
assert.ok(client.includes('vite:beforeUpdate'),'HMR must remain available');
const page=await fetch(base);assert.equal(page.status,200);
console.log('PASS: real Vite client disables recursive console forwarding, retains HMR, and serves the storefront.');
