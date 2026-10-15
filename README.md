# stroy — The art of giving

Live MVP: https://stroy-seven.vercel.app

The landing page is at `/`; the gifting workspace is at `/app`. All eight demo catalog products have locally hosted photos in `public/images`, with Unsplash image IDs recorded in `credits.json`. These photos illustrate fictional demo products.

A thoughtful gifting concierge built with Next.js, Vercel AI SDK, OpenAI, and Tavily. Includes an editable best friend (Alex) and girlfriend (Sophie), a fictional product catalog, a £300 mock wallet, approval flows, and an evidence-based decision log.

## Run locally

```sh
npm install
npm run dev
```

Create `.env.local` with `OPENAI_API_KEY`, a random `WALLET_SECRET` (32+ characters), and `GIFT_RESEARCH_MODE=catalog`. Local development uses the eight demo gifts and makes no Tavily requests, even if a Tavily key is present. Vercel production uses `GIFT_RESEARCH_MODE=web` with server-side `OPENAI_API_KEY` and `TAVILY_API_KEY`. Optionally set `OPENAI_MODEL`; the default is `gpt-4.1-mini`. Keep these values server-side. Never commit secrets.

## Agent flow

1. Read the recipient's notes and extract interests with evidence.
2. Use `discoverGifts` to inspect the demo catalog locally. In production web mode it also searches Tavily for relevant trends and real gift ideas, with source URLs. Generic interest queries exclude recipient name tokens and contact details. Both modes filter mock purchases through spending rules.
3. Use `presentShortlist` to record cited trends, real web gift ideas and eligible demo gifts. Live links are research-only; wallet purchases remain limited to approved demo catalog items.
4. Use `purchaseGift` to attempt one mock purchase. Server code enforces spending rules independently of the model.
5. Automatically purchase below the approval threshold, or queue explicit human approval. Approval rechecks budget, balance, merchant, delivery and duplicate-purchase rules.

All amounts use integer pence. The default automatic threshold is £50. Alex's coffee discovery set costs £36 including delivery. Sophie's pottery workshop costs £88 and requires approval under the default policy.

## Validation

```sh
npm run lint
npm run build
npx tsx --test tests/policy.test.ts tests/research.test.ts
# Requires the dev server and a valid OpenAI key; consumes a small amount of API credit:
npx tsx tests/agent.integration.ts
# Production verifies live Tavily research:
TEST_BASE_URL=https://stroy-seven.vercel.app npx tsx tests/agent.integration.ts
```

## Demo boundaries

- Tavily research is live. Returned web snippets can inspire gift ideas, with source links and retrieval timestamps. Prices, stock and delivery are not verified. A recent article is not proof that something is trending.
- Mock purchases use fictional catalog products, merchants, prices and delivery estimates. No Stripe integration, real orders, or emails are enabled.
- A missing/failed Tavily search shows an unavailable/partial state; the agent can continue with the demo catalog.
- Profiles and agent results are saved in browser localStorage. Wallet state uses a signed, compressed HTTP-only cookie. The wallet retains six recent receipts; clearing browser data creates a fresh demo.
- This is a single-browser demonstration, not a transactional financial ledger. Signed cookies prevent editing amounts but cannot prevent replay or concurrent snapshots across tabs. Production requires an authenticated database, atomic debits, durable idempotency, and distributed rate limits before real money is introduced.
- Twenty AI runs per wallet session bound normal demo use; this is not an abuse-resistant public API quota.
- Free-text profile notes are treated as untrusted data. Structured dislikes and owned items receive deterministic checks; semantic suitability remains the agent's judgment.
- Evidence and fit ratings are model-generated explanations, not verified facts or calibrated probabilities.

## Deploy

```sh
vercel link
vercel env add OPENAI_API_KEY production
vercel env add TAVILY_API_KEY production
# Set this to web:
vercel env add GIFT_RESEARCH_MODE production
vercel env add WALLET_SECRET production
vercel --prod
```

The key must be valid and funded for live AI calls. Provider failures leave the wallet unchanged and show a retryable error.
