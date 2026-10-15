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

test('deterministic Alex and Sophie flow: automatic gift then approved experience', () => {
 const state=wallet();
 const alex={...profiles[0],date:'2099-11-08'};
 const sophie={...profiles[1],date:'2099-11-14'};
 const pottery=catalog.find(p=>p.id==='pottery')!;
 const alexCheck=checkPolicy(coffee,alex,defaultPolicy,state);
 assert.equal(alexCheck.allowed,true);assert.equal(alexCheck.approval,false);
 const alexReceipt:Receipt={id:'alex-gift',profileId:alex.id,name:alex.name,productId:coffee.id,total:alexCheck.total,reason:'Discovery coffee matches stated interest',evidence:'wanting to try beans from different origins',rules:alexCheck.rules,at:new Date().toISOString(),status:'paid',policy:defaultPolicy,budget:alex.budget,date:alex.date};
 settle(alexReceipt,state);assert.equal(state.balance,26400);
 const sophieCheck=checkPolicy(pottery,sophie,defaultPolicy,state);
 assert.equal(sophieCheck.allowed,true);assert.equal(sophieCheck.approval,true);
 const sophieReceipt:Receipt={id:'sophie-gift',profileId:sophie.id,name:sophie.name,productId:pottery.id,total:sophieCheck.total,reason:'A shared pottery experience',evidence:'would love to try a pottery class together',rules:sophieCheck.rules,at:new Date().toISOString(),status:'pending',policy:defaultPolicy,budget:sophie.budget,date:sophie.date};
 settle(sophieReceipt,state);assert.equal(state.balance,26400);
 const approved=checkPolicy(pottery,sophie,defaultPolicy,state,true);
 assert.equal(approved.allowed,true);assert.equal(approved.approval,false);
 sophieReceipt.status='paid';sophieReceipt.rules=approved.rules;settle(sophieReceipt,state);
 assert.equal(state.balance,17600);assert.equal(state.receipts.length,2);
 assert.equal(checkPolicy(pottery,sophie,defaultPolicy,state,true).allowed,false);
});

test('approval rechecks funds and rejects a gift when balance has fallen', () => {
 const sophie={...profiles[1],date:'2099-11-14'};
 const pottery=catalog.find(p=>p.id==='pottery')!;
 assert.equal(checkPolicy(pottery,sophie,defaultPolicy,wallet()).approval,true);
 const state={...wallet(),balance:8700};
 const approval=checkPolicy(pottery,sophie,defaultPolicy,state,true);
 assert.equal(approval.allowed,false);assert.match(approval.reason,/P4/);assert.equal(state.balance,8700);
});
