# stroy — The art of giving

[Live app](https://stroy-seven.vercel.app) · [GitHub](https://github.com/DinIskakov/stroy)

A personal gift agent built with Next.js, Vercel AI SDK, OpenAI, Tavily, Cognee, and Stripe. Start with Alex (best friend), Sophie (girlfriend), or your own recipient. The agent explains its choices, follows your spending policy, and either pays within its mandate or asks for approval.

The landing page is `/`; the workspace is `/app`. **Find a gift** opens a large centered popup with animated activity streamed from the actual agent stages. Runs begin only when clicked. There are no subscriptions, scheduled purchases, or automatic occasion triggers.

## Run locally

```sh
npm install
cp .env.example .env.local
# Add OPENAI_API_KEY and STRIPE_SECRET_KEY; replace WALLET_SECRET in .env.local.
npm run dev
```

The example selects `GIFT_RESEARCH_MODE=catalog`, `PAYMENT_PROVIDER=stripe`, `STRIPE_PAYMENT_FLOW=payout`, `SPENDING_ALLOWANCE_PENCE=34600`, and `COGNEE_ENABLED=false`. The current payment demo is outgoing Stripe sandbox spending, with a £346 gift allowance. Local gift research uses eight pictured gift selections without Tavily calls. Cognee is disabled locally unless `COGNEE_ENABLED=true` is explicitly set. `OPENAI_MODEL` defaults to `gpt-4.1-mini`.

For a deliberately offline demo only, set `PAYMENT_PROVIDER=mock`. A successful mock run shows **Payment complete** with a **Stripe payment demo / SIMULATED** receipt and the demo balance before and after. It makes no Stripe requests and does not invent a Stripe transaction ID.

Images are served locally: catalog product illustrations are in `public/images/products`; landing photos are in `public/images`. Live web gift cards also include a matching illustration labelled **Illustrative photo**. These are not verified photographs of a seller’s listing. See the image credit files in those directories.

## What the agent does

1. Extract stated and inferred interests from the supplied profile, with supporting evidence. Recall that person’s scoped Cognee memory when enabled.
2. Inspect eligible gift selections. Production web mode also searches Tavily for trends and real gift ideas, retaining source links and queries. Search queries use generic interests and the budget, rather than the recipient’s identity or full notes.
3. Present a considered shortlist. Live web finds are **research only**: they cannot become payment destinations.
4. Recheck the chosen gift in server code. Demo policy: £346 spending allowance (configured with `SPENDING_ALLOWANCE_PENCE`), £50 automatic limit, recipient budget including delivery, and approved merchants only. Also check funds, availability, dislikes, ownership, delivery estimates, and duplicate occasions.
5. Pay automatically within the mandate, or wait for explicit approval. Approval rechecks the recorded policy and recipient preference snapshot. A successful receipt records the choice, evidence, and rules passed.

Alex’s example coffee set is £36 including delivery. Sophie’s £88 pottery workshop requires approval under the default £50 limit. These are fictional products and merchants; the app places no real gift orders and promises no real shipping.

## Stripe sandbox

For outgoing sandbox money movement, set `PAYMENT_PROVIDER=stripe`, `STRIPE_PAYMENT_FLOW=payout`, and a valid server-side `STRIPE_SECRET_KEY` (`sk_test_…` or `rk_test_…`). The account owner must configure an external **GBP test bank account** for the platform through Stripe Dashboard first. The setup helper cannot add the platform’s own bank account through the connected-account API. An approved gift can then create a GBP payout from the platform’s available sandbox balance. This needs no Connect recipient; it does require the platform’s payout destination. Live keys are rejected and failures never silently fall back to mock payments.

The receipt shows the real payout ID (`po_…`), Stripe Dashboard link, and platform GBP balance before/after when retrievable. **This is outgoing movement of existing test funds**, not an incoming test-card charge. Once Stripe confirms a submitted payout and its outgoing balance transaction, the gift allowance is reserved immediately: a £36 payout changes £346 → £310. The receipt remains processing until Stripe reports paid. Confirmation does not deduct a second time; a later failed payout releases the reserved allowance. The Check payout action checks the same receipt without creating another intended payment. Failed or unconfirmed payouts are not labelled complete.

The gift spending allowance is separate from the Stripe account’s actual available balance. The configured allowance of £346 → £310 after a £36 reservation does not prove that Stripe had £346 available: fees, pending funds, and existing payouts can produce different platform balances. The UI must show retrieved balance evidence rather than inventing a round starting balance.

The optional Connect transfer flow uses `STRIPE_PAYMENT_FLOW=transfer` and `STRIPE_MERCHANT_ACCOUNTS`, a server-owned mapping from canonical demo merchants to enabled connected recipients. This also debits available platform GBP and requires an active recipient transfer capability. Its receipt records `tr_…`, destination and balance evidence. The setup helper is only for that optional flow:

```sh
node scripts/setup-stripe-sandbox.mjs
```

No incoming card-charge flow is used to demonstrate outgoing spending. Both supported Stripe paths use test funds only; neither performs a real gift checkout, places an order, or provides shipping. Explicit `PAYMENT_PROVIDER=mock` remains available only for an offline demonstration and creates no Stripe transaction.

## Cognee memory

Production enables Cognee when `COGNEE_API_KEY` is configured unless `COGNEE_ENABLED=false`. Locally, opt in with `COGNEE_ENABLED=true`; `COGNEE_API_URL` defaults to `https://api.cognee.ai`.

Valid profile edits autosave after a typing pause. Enabled Cognee stores timestamped snapshots and indexes them asynchronously; gift runs recall the person’s scoped dataset. Current profile details override older memory. Failed sync retains the browser copy and reports its status. Each browser has an HTTP-only memory scope; each person has a separate dataset. Clearing the browser cookie loses this app’s access to that scope but does not delete cloud records. Profile saving does not launch gift research or spending.

## Deploy from GitHub

The Vercel project is connected to this repository: pushes to `main` trigger production deployments. Configure secrets in Vercel’s project environment settings, then deploy the corresponding GitHub commit.

- Required: `OPENAI_API_KEY`, `WALLET_SECRET`.
- Production research: `GIFT_RESEARCH_MODE=web`, `TAVILY_API_KEY`.
- Sandbox payments: `PAYMENT_PROVIDER=stripe`, `STRIPE_PAYMENT_FLOW=payout`, `STRIPE_SECRET_KEY`. The optional transfer flow additionally requires `STRIPE_MERCHANT_ACCOUNTS`.
- Optional memory: `COGNEE_API_KEY`; enable explicitly with `COGNEE_ENABLED=true` or use the production default.

All keys remain server-side. Never commit `.env.local`.

## Validation

```sh
npm run lint
npm run build
npx tsx --test tests/policy.test.ts tests/research.test.ts tests/cognee.test.ts tests/payments.test.ts
# Running integration tests uses OpenAI credit and the configured payment provider.
npx tsx tests/agent.integration.ts
# Production also exercises live Tavily research and configured sandbox payments:
TEST_BASE_URL=https://stroy-seven.vercel.app npx tsx tests/agent.integration.ts
```

## MVP limits

Profiles and results persist in localStorage; a signed HTTP-only cookie stores the allowance and six recent receipts. This browser-scoped state is not a durable financial ledger and cannot prevent cookie replay or concurrent snapshots. Stripe idempotency protects retries of the same receipt, not separately created receipts from replayed sessions. Real funds require authentication, durable records, atomic spending controls, and complete occasion history.

Tavily returns snippets, not verified checkout prices, stock, or shipping. Model explanations and fit scores are not verified facts. Structured preference checks use keywords. Twenty completed AI runs per wallet session bound ordinary demo use. There are no real orders, shipping, email reminders, subscriptions, or unattended purchases.
