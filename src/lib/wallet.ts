import { createHmac, timingSafeEqual } from 'node:crypto';
import { deflateSync, inflateSync } from 'node:zlib';
import { cookies } from 'next/headers';
import { type Wallet } from './data';
const initial = (): Wallet => ({ balance:30000, receipts:[], runs:0 });
function secret() { const s = process.env.WALLET_SECRET || process.env.OPENAI_API_KEY; if (!s) throw new Error('Wallet signing secret is not configured.'); return s; }
export async function readWallet(): Promise<Wallet> {
 const value = (await cookies()).get('stroy-wallet')?.value;
 if (!value) return initial();
 try { const [payload, signature] = value.split('.'); const expected = createHmac('sha256',secret()).update(payload).digest('base64url'); if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature),Buffer.from(expected))) return initial(); return JSON.parse(inflateSync(Buffer.from(payload,'base64url')).toString()); } catch { return initial(); }
}
export async function saveWallet(wallet: Wallet) {
 // Keep the cookie compact; full decision receipts are also returned to the UI.
 const compact = {...wallet,receipts:wallet.receipts.slice(0,6).map(r=>({...r,reason:r.reason.slice(0,200),evidence:r.evidence.slice(0,120),rules:[],policy:{...r.policy,allowedMerchants:r.policy.allowedMerchants}}))};
 const payload = deflateSync(Buffer.from(JSON.stringify(compact))).toString('base64url');
 const signature = createHmac('sha256',secret()).update(payload).digest('base64url');
 (await cookies()).set('stroy-wallet',`${payload}.${signature}`,{ httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict',path:'/',maxAge:60*60*24*7 });
}
