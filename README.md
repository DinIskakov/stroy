# stroy — The art of giving

[Live app](https://stroy-seven.vercel.app) · [GitHub](https://github.com/DinIskakov/stroy)

A personal gift agent built with Next.js, Vercel AI SDK, OpenAI, Tavily, Cognee, and Stripe. Start with Alex (best friend), Sophie (girlfriend), or your own recipient. The agent explains its choices, follows your spending policy, and either pays within its mandate or asks for approval.

The landing page is `/`; the workspace is `/app`. **Find a gift** opens a large centered popup with animated activity streamed from the actual agent stages. Runs begin only when clicked. There are no subscriptions, scheduled purchases, or automatic occasion triggers.

## Run locally

```sh
npm install
cp .env.example .env.local
# Add OPENAI_API_KEY and replace WALLET_SECRET in .env.local.
npm run dev
```

The example selects `GIFT_RESEARCH_MODE=catalog`, `PAYMENT_PROVIDER=mock`, and `COGNEE_ENABLED=false` for a local demo. Local gift research uses eight pictured gift selections without Tavily calls. Cognee is disabled locally unless `COGNEE_ENABLED=true` is explicitly set. `OPENAI_MODEL` defaults to `gpt-4.1-mini`.

In local mock mode, a successful run shows **Payment complete** with a **Stripe payment demo / SIMULATED** receipt and the demo balance before and after. It makes no Stripe requests and does not invent a Stripe transaction ID.

Images are served locally: catalog product illustrations are in `public/images/products`; landing photos are in `public/images`. Live web gift cards also include a matching illustration labelled **Illustrative photo**. These are not verified photographs of a seller’s listing. See the image credit files in those directories.

## What the agent does

1. Extract stated and inferred interests from the supplied profile, with supporting evidence. Recall that person’s scoped Cognee memory when enabled.
2. Inspect eligible gift selections. Production web mode also searches Tavily for trends and real gift ideas, retaining source links and queries. Search queries use generic interests and the budget, rather than the recipient’s identity or full notes.
3. Present a considered shortlist. Live web finds are **research only**: they cannot become payment destinations.
4. Recheck the chosen gift in server code. Default policy: £300 spending allowance, £50 automatic limit, recipient budget including delivery, and approved merchants only. Also check funds, availability, dislikes, ownership, delivery estimates, and duplicate occasions.
5. Pay automatically within the mandate, or wait for explicit approval. Approval rechecks the recorded policy and recipient preference snapshot. A successful receipt records the choice, evidence, and rules passed.

Alex’s example coffee set is £36 including delivery. Sophie’s £88 pottery workshop requires approval under the default £50 limit. These are fictional products and merchants; the app places no real gift orders and promises no real shipping.

## Stripe sandbox

With `PAYMENT_PROVIDER=stripe`, a valid server-side `STRIPE_SECRET_KEY` (`sk_test_…` or `rk_test_…`), and `STRIPE_MERCHANT_ACCOUNTS`, approved purchases create **Stripe Connect sandbox transfers**. Test funds leave the platform’s available GBP balance for a canonical, approved connected merchant account. Live keys are rejected. Stripe failures never silently fall back to mock payments.

`STRIPE_MERCHANT_ACCOUNTS` maps the four catalog merchant names to their sandbox connected account IDs. The agent and profile cannot supply a destination. The setup helper creates test merchant accounts and funds the sandbox when supported:

```sh
node scripts/setup-stripe-sandbox.mjs
```

Stripe-managed recipients must finish hosted verification before their `transfers` capability becomes active. The setup uses Stripe’s passing test identity values: **1 January 1902** and phone **0000000000**. If an older recipient failed identity verification, correct it through Stripe’s hosted form; Stripe locks API identity edits after onboarding.

The wallet shows **spending allowance** separately from the actual **Stripe sandbox balance**. Receipts show the transfer ID, Stripe Dashboard link, destination, and available platform balance before/after when retrievable. Failed payments are not labelled paid. An ambiguous result remains processing; **Check payment** retries confirmation using the same transaction idempotency key. Allowance is deducted only once a payment is confirmed. No live money or real merchant checkout is involved.

## Cognee memory

Production enables Cognee when `COGNEE_API_KEY` is configured unless `COGNEE_ENABLED=false`. Locally, opt in with `COGNEE_ENABLED=true`; `COGNEE_API_URL` defaults to `https://api.cognee.ai`.

Valid profile edits autosave after a typing pause. Enabled Cognee stores timestamped snapshots and indexes them asynchronously; gift runs recall the person’s scoped dataset. Current profile details override older memory. Failed sync retains the browser copy and reports its status. Each browser has an HTTP-only memory scope; each person has a separate dataset. Clearing the browser cookie loses this app’s access to that scope but does not delete cloud records. Profile saving does not launch gift research or spending.

## Deploy from GitHub

The Vercel project is connected to this repository: pushes to `main` trigger production deployments. Configure secrets in Vercel’s project environment settings, then deploy the corresponding GitHub commit.

- Required: `OPENAI_API_KEY`, `WALLET_SECRET`.
- Production research: `GIFT_RESEARCH_MODE=web`, `TAVILY_API_KEY`.
- Sandbox payments: `PAYMENT_PROVIDER=stripe`, `STRIPE_SECRET_KEY`, `STRIPE_MERCHANT_ACCOUNTS`.
- Optional memory: `COGNEE_API_KEY`; enable explicitly with `COGNEE_ENABLED=true` or use the production default.

All keys remain server-side. Never commit `.env.local`.

## Validation

```sh
npm run lint
npm run build
npx tsx --test tests/policy.test.ts tests/research.test.ts tests/cognee.test.ts tests/payments.test.ts
# Running integration tests uses OpenAI credit and the configured payment provider.
npx tsx tests/agent.integration.ts
# Production also exercises live Tavily research and configured sandbox transfers:
TEST_BASE_URL=https://stroy-seven.vercel.app npx tsx tests/agent.integration.ts
```

## MVP limits

Profiles and results persist in localStorage; a signed HTTP-only cookie stores the allowance and six recent receipts. This browser-scoped state is not a durable financial ledger and cannot prevent cookie replay or concurrent snapshots. Stripe idempotency protects retries of the same receipt, not separately created receipts from replayed sessions. Real funds require authentication, durable records, atomic spending controls, and complete occasion history.

Tavily returns snippets, not verified checkout prices, stock, or shipping. Model explanations and fit scores are not verified facts. Structured preference checks use keywords. Twenty completed AI runs per wallet session bound ordinary demo use. There are no real orders, shipping, email reminders, subscriptions, or unattended purchases.
