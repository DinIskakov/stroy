import assert from 'node:assert/strict';
import { request } from '@playwright/test';
import { defaultPolicy, profiles } from '../src/lib/data';

async function main() {
 const client=await request.newContext({baseURL:process.env.TEST_BASE_URL || 'http://localhost:3000',timeout:90000});
 const post=async(body:unknown)=>client.post('/api/agent',{data:body});
 try {
  const alexResponse=await post({action:'run',profile:profiles[0],policy:defaultPolicy});
  assert.equal(alexResponse.status(),200,await alexResponse.text());
  const alex=await alexResponse.json();
  assert.equal(alex.result.receipt.status,'paid');
  assert.equal(alex.result.receipt.productId,'coffee');
  assert.equal(alex.wallet.balance,26400);
  assert.ok(alex.result.trace.length>=3);
  assert.ok(alex.result.recommendations.length>=1);
  console.log('PASS Alex: coffee selected and £36 deducted from £300 mock balance');
  const sophieResponse=await post({action:'run',profile:profiles[1],policy:defaultPolicy});
  assert.equal(sophieResponse.status(),200,await sophieResponse.text());
  const sophie=await sophieResponse.json();
  assert.equal(sophie.result.receipt.status,'pending');
  assert.equal(sophie.result.receipt.productId,'pottery');
  assert.equal(sophie.wallet.balance,26400);
  const approved=await post({action:'approve',receiptId:sophie.result.receipt.id});
  assert.equal(approved.status(),200,await approved.text());
  const approval=await approved.json();
  assert.equal(approval.receipt.status,'paid');assert.equal(approval.wallet.balance,17600);
  const duplicate=await post({action:'approve',receiptId:sophie.result.receipt.id});
  assert.equal(duplicate.status(),409);
  console.log('PASS Sophie: pottery requires approval, £88 deducted once; duplicate approval rejected');
  const invalid=await post({action:'run',profile:{...profiles[0],budget:-1},policy:defaultPolicy});
  assert.equal(invalid.status(),400);
  for(const [name,profile,policy] of [
   ['insufficient budget',{...profiles[0],id:'budget-case',budget:100},defaultPolicy],
   ['no allowed merchant',{...profiles[0],id:'merchant-case'},{...defaultPolicy,allowedMerchants:[]}],
  ] as const) {
   const response=await post({action:'run',profile,policy});
   assert.equal(response.status(),200,await response.text());
   const result=await response.json();assert.equal(result.result.receipt,undefined);assert.equal(result.wallet.balance,17600);
   console.log(`PASS ${name}: no purchase and balance unchanged`);
  }
 } finally {await client.dispose();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
