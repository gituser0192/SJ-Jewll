import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import ts from 'typescript';
const source=ts.transpileModule(readFileSync('lib/shop-types.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {rupeesToPaise,money}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
for(const [value,expected] of [['0',0],['0.01',1],['99.99',9999],['1250.50',125050],['10000000',1000000000]])assert.equal(rupeesToPaise(value),expected);
for(const value of ['-1','1.001','1e5','NaN','10000001',''])assert.throws(()=>rupeesToPaise(value));assert.match(money(9999),/99\.99/);
console.log('PASS: exact rupee conversion, amount limits and invalid price rejection.');
