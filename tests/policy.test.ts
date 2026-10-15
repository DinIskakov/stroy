import assert from 'node:assert/strict';
import test from 'node:test';
import { catalog, defaultPolicy, profiles, type Wallet, type Receipt } from '../src/lib/data';
import { checkPolicy, settle } from '../src/lib/policy';

const profile = { ...profiles[0], date: '2099-11-08' };
const wallet = (): Wallet => ({ balance: 30000, receipts: [], runs: 0 });
const coffee = catalog.find(p => p.id === 'coffee')!;

test('coffee includes delivery and qualifies for automatic purchase', () => {
 const result = checkPolicy(coffee, profile, defaultPolicy, wallet());
 assert.equal(result.allowed, true); assert.equal(result.approval, false); assert.equal(result.total, 3600);
});
test('budget and balance are hard limits even with explicit approval', () => {
 assert.match(checkPolicy(coffee, {...profile,budget:3500},defaultPolicy,wallet(),true).reason,/P3/);
 assert.match(checkPolicy(coffee,profile,defaultPolicy,{...wallet(),balance:3500},true).reason,/P4/);
});
test('merchant, availability, preferences and arrival constraints are enforced', () => {
 assert.match(checkPolicy(coffee,profile,{...defaultPolicy,allowedMerchants:[]},wallet()).reason,/P2/);
 assert.equal(checkPolicy({...coffee,available:false},profile,defaultPolicy,wallet()).allowed,false);
 assert.match(checkPolicy(coffee,{...profile,dislikes:['coffee']},defaultPolicy,wallet()).reason,/P5/);
 assert.match(checkPolicy(coffee,{...profile,owned:['coffee']},defaultPolicy,wallet()).reason,/P5/);
 assert.match(checkPolicy(coffee,{...profile,date:'2000-01-01'},defaultPolicy,wallet()).reason,/P7/);
});
test('approval threshold and disabled autopilot require review', () => {
 assert.equal(checkPolicy(coffee,profile,{...defaultPolicy,autoLimit:3500},wallet()).approval,true);
 assert.equal(checkPolicy(coffee,profile,{...defaultPolicy,autopilot:false},wallet()).approval,true);
 assert.equal(checkPolicy(coffee,profile,{...defaultPolicy,autopilot:false},wallet(),true).approval,false);
});
test('pending purchase leaves funds intact; paid receipt prevents another occasion purchase', () => {
 const state=wallet();
 const receipt:Receipt={id:'test',profileId:profile.id,name:profile.name,productId:coffee.id,total:3600,reason:'Coffee interest',evidence:'Likes coffee',rules:[],at:new Date().toISOString(),status:'pending',policy:defaultPolicy,budget:profile.budget,date:profile.date};
 settle(receipt,state);assert.equal(state.balance,30000);
 receipt.status='paid';settle(receipt,state);assert.equal(state.balance,26400);assert.equal(state.receipts.length,1);
 assert.match(checkPolicy(coffee,profile,defaultPolicy,state).reason,/P6/);
});
