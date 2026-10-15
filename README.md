# stroy — The art of giving

Live MVP: https://stroy-seven.vercel.app

A thoughtful gifting concierge built with Next.js, Vercel AI SDK, and OpenAI. Includes an editable best friend (Alex) and girlfriend (Sophie), a fictional product catalog, a £300 mock wallet, approval flows, and an evidence-based decision log.

## Run locally

```sh
npm install
npm run dev
```

Create `.env.local` with `OPENAI_API_KEY` and a random `WALLET_SECRET` (32+ characters). Optionally set `OPENAI_MODEL`; the default is `gpt-4.1-mini`. Keep these values server-side. Never commit secrets.

## Agent flow

1. Read the recipient's notes and extract interests with evidence.
2. Use `discoverGifts` to inspect the demo catalog and reject policy violations.
3. Use `presentShortlist` to record eligible gifts and explain their fit.
4. Use `purchaseGift` to attempt one mock purchase. Server code enforces spending rules independently of the model.
5. Automatically purchase below the approval threshold, or queue explicit human approval. Approval rechecks budget, balance, merchant, delivery and duplicate-purchase rules.

All amounts use integer pence. The default automatic threshold is £50. Alex's coffee discovery set costs £36 including delivery. Sophie's pottery workshop costs £88 and requires approval under the default policy.

## Validation

```sh
npm run lint
npm run build
npx tsx --test tests/policy.test.ts
# Requires the dev server and a valid OpenAI key; consumes a small amount of API credit:
npx tsx tests/agent.integration.ts
```

## Demo boundaries

- All products, merchants, prices, delivery estimates and payments are fictional. No Stripe integration, live product discovery, real orders, or emails are enabled.
- Profiles and agent results are saved in browser localStorage. Wallet state uses a signed, compressed HTTP-only cookie. The wallet retains six recent receipts; clearing browser data creates a fresh demo.
- This is a single-browser demonstration, not a transactional financial ledger. Signed cookies prevent editing amounts but cannot prevent replay or concurrent snapshots across tabs. Production requires an authenticated database, atomic debits, durable idempotency, and distributed rate limits before real money is introduced.
- Twenty AI runs per wallet session bound normal demo use; this is not an abuse-resistant public API quota.
- Free-text profile notes are treated as untrusted data. Structured dislikes and owned items receive deterministic checks; semantic suitability remains the agent's judgment.
- Evidence and fit ratings are model-generated explanations, not verified facts or calibrated probabilities.

## Deploy

```sh
vercel link
vercel env add OPENAI_API_KEY production
vercel env add WALLET_SECRET production
vercel --prod
```

The key must be valid and funded for live AI calls. Provider failures leave the wallet unchanged and show a retryable error.
