# stroy — The art of giving

Live MVP: https://stroy-seven.vercel.app

A thoughtful gifting concierge built with Next.js, Vercel AI SDK, OpenAI, and Tavily. Includes an editable best friend (Alex) and girlfriend (Sophie), a fictional product catalog, a £300 mock wallet, approval flows, and an evidence-based decision log.

## Run locally

```sh
npm install
npm run dev
```

Create `.env.local` with `OPENAI_API_KEY`, `TAVILY_API_KEY`, and a random `WALLET_SECRET` (32+ characters). Optionally set `OPENAI_MODEL`; the default is `gpt-4.1-mini`. Keep these values server-side. Never commit secrets.

## Agent flow

1. Read the recipient's notes and extract interests with evidence.
2. Use `discoverGifts` to search Tavily for relevant trends and real gift ideas, with source URLs, while filtering the demo catalog through spending rules. Generic interest queries exclude recipient name tokens and contact details.
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
vercel env add WALLET_SECRET production
vercel --prod
```

The key must be valid and funded for live AI calls. Provider failures leave the wallet unchanged and show a retryable error.

## Cognee people memory

Set `COGNEE_API_KEY` in `.env.local` (server only). `COGNEE_API_URL` defaults to `https://api.cognee.ai`. Configure the same variables in your hosting environment when deploying.

Open Your people, edit Sophie (the girlfriend example), add a birthday or address, and edit her details. Valid changes save automatically after a short typing pause; the app also syncs existing people when it loads. The app uploads a timestamped snapshot of her details to Cognee and queues graph indexing. The editor and page report sync status. Failed requests retain the browser copy and retry automatically after 15 seconds. Unchanged profiles are skipped during the session, and uploads run sequentially to preserve browser memory scope. Incomplete profiles are not uploaded until required fields are valid. Use Done to close the editor; saving does not require this button.

Gift runs retrieve memory from that person's dataset; current profile details override older snapshots. History is append-only: edits add a new snapshot rather than deleting old personal details. Indexing runs asynchronously, so new facts may not appear in search immediately. Cloud records can be managed in Cognee.

Each browser has a random HTTP-only memory cookie and each person a separate dataset. Dataset scope is derived on the server, never accepted from the client. This demo has no account login or cross-device recovery: clearing the cookie loses access through this app, but does not delete Cognee records. The editable profile list still loads from browser storage.

API contract: [Cognee REST documentation](https://docs.cognee.ai/api-reference/introduction). No additional SDK dependency is required.

Run the isolated memory contract check with `npx tsx --test tests/cognee.test.ts`.
