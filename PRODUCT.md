# stroy — The art of giving

## Purpose and current release

stroy is a personal gifting concierge. It turns the small things someone tells you about a person into a considered gift, then acts within spending rules you control.

The problem: remembering an occasion is only the beginning. Choosing a relevant gift, avoiding something the person already owns, keeping within budget, and handling the purchase all take attention. stroy combines recipient context and controlled purchasing in one flow, with a reason behind each decision.

This release is a working hackathon MVP for **Briefcase × Stripe — Track 01: Agents that Spend**. The live app is https://stroy-seven.vercel.app. Code is at https://github.com/DinIskakov/stroy; pushes to `main` automatically deploy to Vercel.

**Current boundary:** OpenAI decisions use the Vercel AI SDK. Production uses live Tavily research with source-linked observations and gift ideas; local development uses pictured gift selections without Tavily calls. The eight gift products, four merchants, prices, stock flags, and delivery estimates are fictional. With Stripe configured, approved purchases transfer **sandbox test funds** from the platform’s available GBP balance to canonical connected merchant accounts. Receipts include the transfer ID and balance evidence. Explicit mock mode remains available. No live money is spent, no merchant checkout is performed, and no real gift is ordered or shipped. The Stripe transfer path provides the test-mode money movement needed for the hackathon demonstration; successful execution must be visible in the submission recording.

## Interface

A blue landing page introduces stroy with the original serif wordmark and twelve gift photos moving along a tilted elliptical path, inspired by the supplied reference. All photos stay within the visible hero throughout the motion. Scrollable sections explain the workflow, recipient examples, research, spending controls and common questions. Its main action opens the workspace at `/app`. The workspace focuses on People, Activity, Wallet and Spending rules; there is no catalog navigation tab. Clicking Find a gift opens a large centered popup with animated icons and a timeline driven by streamed server progress events. There is no launch mode toggle and no timer pretending a search has completed. Runs start only on a click; there are no subscriptions or unattended runs. All eight demo products have local photos, so catalog imagery remains available during a local demo. Photos illustrate the fictional catalog and do not represent a verified real merchant listing. Motion respects reduced-motion settings.

## Product requirements and why they matter

| Requirement                      | Current behavior                                                                                                                                                                                    | Why we need it                                                                                          |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Know the recipient               | Create and edit people, relationships, notes, interests, explicit dislikes, owned items, occasions, dates and budgets.                                                                              | Personal context makes a gift relevant and helps avoid predictable mistakes.                            |
| Explain inferred preferences     | The model extracts up to six interests with supporting text and marks each as stated or inferred.                                                                                                   | Users should understand the basis for a recommendation and be able to correct the source profile.       |
| Offer a considered shortlist     | The model proposes one to three eligible gifts with reasons, evidence and subjective fit scores.                                                                                                    | Gives users visibility into the choice without overwhelming them.                                       |
| Act autonomously within rules    | The agent chooses and attempts one purchase per run through Stripe sandbox transfers or explicit mock mode. Eligible purchases at or below the automatic limit can complete independently.          | Demonstrates an agent that can spend under a bounded mandate.                                           |
| Escalate to the user             | Purchases above the automatic limit, or all purchases with autopilot off, wait for approval. Users can approve or decline.                                                                          | Preserves user control over higher-value or manually reviewed decisions.                                |
| Enforce hard constraints in code | Server tools check the catalog, budget, balance, merchant, preferences, duplicate occasion purchases and arrival estimate.                                                                          | Model reasoning alone is insufficient to enforce a spending policy.                                     |
| Explain the spend                | Show extracted interests, shortlist reasoning, activity entries and receipts containing evidence, policy snapshot, rules, amount, merchant and status.                                              | Makes “why did you pay this?” answerable and makes mistakes easier to inspect.                          |
| Keep the demo usable             | Profiles, policy settings and agent results persist in the browser; a signed cookie persists spending allowance and receipts. Stripe balance is retrieved separately. Responsive desktop/mobile UI. | Lets a user complete and revisit a demonstration without setting up accounts or payment infrastructure. |

## Agent workflow

A user starts a run for a recipient. The server sends that profile, the selected policy and wallet balance to OpenAI using the Vercel AI SDK. The default model is `gpt-4.1-mini`, configurable through `OPENAI_MODEL`.

1. **`discoverGifts`:** Record extracted interests and evidence. Search Tavily in parallel for recent trend inspiration (past year) and product/gift pages, up to four sources per query. Build queries from up to three generic interests and the budget, stripping recipient name tokens, emails, URLs and phone-like strings. Evaluate all eight demo catalog entries using server policy checks; return eligible products, rejection reasons and web sources.
2. **`presentShortlist`:** Record up to three cited trend observations, three web gift ideas and three demo recommendations. Server code validates citation IDs against returned sources and removes unknown or ineligible demo product IDs. A shortlist requires discovery first. Live web ideas link to source pages and include labelled illustrative photography. They are research-only and cannot become payment destinations.
3. **`purchaseGift`:** Select a product from the validated shortlist, recheck policy, and prepare a processing receipt or queue a pending approval. Only one receipt can be created per agent run. After the model finishes, server payment code executes the eligible purchase; the model cannot mark Stripe payments successful.
4. **Explain the result:** Generate a short summary alongside the structured decision trace and receipt.
5. **If pending:** Explicit approval rechecks the recorded policy and saved recipient preferences, then executes the payment. Declining does not pay. Confirmed payments deduct the spending allowance once. Processing payments can be checked again with the same Stripe idempotency key; failed or unconfirmed payments are not labelled paid. An already resolved approval cannot be approved again through the normal API flow.

The agent loop permits up to six generation steps and has a 85-second timeout. Failed or unconfirmed payments do not deduct the spending allowance; a Stripe transfer whose confirmation is delayed may already have moved test funds and must be checked using the same receipt. The summary and evidence are model-generated; they are not independently verified quotes or formal proofs.

**Ranking:** the current agent uses contextual judgment and subjective scores from 0–100. It can use cited web research as inspiration, but does not implement fixed 50/20/20/10 weights, calibrated trend scoring, model training, or a separate recommendation model. Personal relevance takes priority over popularity.

## Profile → interests → research → gift

1. Create or edit a profile with notes about the person, their interests, dislikes, owned items, occasion and budget. “Find a gift” starts the pipeline; saving a profile does not launch gift research or payments. When Cognee is enabled, valid edits can trigger profile-memory API calls.
2. OpenAI interprets the notes as stated and inferred interests with evidence. Edit the source profile and rerun to correct the result.
3. Tavily searches public web content for relevant trends and real gift ideas. It receives generic interest queries and the budget, not the full profile or notes. Name/contact filtering reduces accidental identity exposure; it is not a general-purpose personal-data redaction guarantee.
4. OpenAI uses returned snippets to explain which trends and gift ideas could fit. Trends are signals from retrieved articles, not proof of popularity or evidence about the recipient. All displayed citations must resolve to a returned source ID.
5. The UI presents live gift ideas with links and a separate shortlist for policy-gated sandbox or mock purchases. Real merchant links do not become approved payment counterparties.

Tavily search returns page snippets rather than fully reading every linked page. No direct profile scraping, social account access, or fetching URLs from notes is implemented. Source retrieval time is recorded; a page may still be stale. The app does not validate live checkout totals, stock or arrival estimates. Users must check seller details before buying externally.

In production web mode, each run allows one research call, with two parallel basic searches and 15-second timeouts. Local catalog mode returns an explicit `catalog` status without making a Tavily request, even if its key is present. `GIFT_RESEARCH_MODE=catalog|web` selects the mode; without an override, Vercel production defaults to web and local development to catalog. Production has both API keys configured as server-side encrypted environment variables. One failed search retains the successful results and marks research partial. Missing credentials, failures or no usable sources produce an unavailable state; the agent may continue using the demo catalog without claiming live findings.

Retrieved text is untrusted data and cannot authorize spending or change the policy. OpenAI still receives the full supplied profile for interpretation. Explicit dislikes and owned-item fields receive deterministic checks; preferences mentioned only in prose depend on model understanding.

## Written spending policy

Defaults: **£300 starting spending allowance**, **£50 automatic purchase limit**, autopilot **on**, and all four demo merchants approved: **Origin Studio, Still & Form, Field Notes, Clay House**. Alex has a **£65 recipient budget**; Sophie has **£120**.

All amounts are stored as integer pence. Purchase totals include the catalog price plus shipping. Taxes are not separately modeled. Users can change the automatic limit, toggle autopilot, and select merchants in **Spending rules**; recipient budgets are edited on profiles.

| Rule                            | Enforcement                                                                                                                                                                | Why it exists                                                                                       |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| P1 — Availability               | Reject a product whose catalog availability flag is false.                                                                                                                 | Avoid attempting an unavailable gift.                                                               |
| P2 — Approved merchant          | Product merchant must be in the policy allowlist.                                                                                                                          | Constrain where the agent may spend.                                                                |
| P3 — Recipient budget           | Price plus shipping must not exceed the recipient budget, including after approval.                                                                                        | Make the user’s total spending cap binding.                                                         |
| P4 — Wallet funds               | Total must not exceed the remaining spending allowance. Approval rechecks funds; Stripe also requires sufficient available GBP sandbox balance.                            | Prevent overspending the available demo balance.                                                    |
| P5 — Preferences and ownership  | Case-insensitive substring checks compare structured dislikes and owned items against product names and tags.                                                              | Reject known unsuitable or already-owned items. This is keyword matching, not a semantic guarantee. |
| P6 — One paid gift per occasion | Reject if a retained paid receipt has the same recipient ID and occasion date. The API also blocks a new run while a matching approval or payment confirmation is pending. | Avoid repeated purchases during the normal demo flow.                                               |
| P7 — Arrival                    | Current time plus catalog delivery days must be on or before the occasion date’s end in UTC.                                                                               | Avoid selecting a gift estimated to arrive late. This is not a real delivery promise.               |
| P8 — Approval                   | Autopilot must be on and total must be at or below the automatic limit for automatic spending. Otherwise explicit approval is required.                                    | Bound autonomy while allowing the best suitable gift to go to review.                               |

Approval overrides only the automatic-purchase requirement; it cannot override budget, balance, merchant, availability, duplicate-purchase or delivery checks. Pending receipts retain their original policy and budget. Changes to settings do not retroactively modify them.

**Approval snapshots:** Receipts save the policy, recipient budget, date, dislikes and owned items used for the decision. Approval rechecks those recorded constraints. Later edits do not silently replace the receipt’s saved mandate.

Pending requests do not deduct or reserve money. The balance can therefore change before approval, and sufficient funds must be checked again.

## Validation and default scenarios

The earlier mock integration runs used actual OpenAI tool calls and HTTP requests with a cookie jar, locally and against Vercel on 15 October 2026. These historical results describe the mock path; Stripe sandbox execution now records transfer evidence separately.

| Scenario              | Observed behavior and assertions                                                                                                                                                                                                                                                                                                                                                       |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Alex — best friend    | Notes mention specialty coffee and trying beans from different origins; a grinder and camera are already owned, and alcohol is disliked. Agent selected the coffee discovery set: £32 + £4 shipping = **£36**. It was under the £65 budget and £50 automatic limit. Paid receipt created; wallet **£300 → £264**. Test also checked that recommendations and activity entries existed. |
| Sophie — girlfriend   | Notes mention handmade ceramics and wanting a pottery class together. Agent selected the two-person workshop for **£88**. It fit the £120 budget but exceeded the £50 automatic limit. Pending receipt created; wallet stayed **£264**. Explicit approval paid once; wallet **£264 → £176**. Repeating approval returned HTTP 409.                                                     |
| Invalid budget        | A negative recipient budget returned HTTP 400.                                                                                                                                                                                                                                                                                                                                         |
| No affordable gift    | A £1 recipient budget produced no receipt and no balance change.                                                                                                                                                                                                                                                                                                                       |
| No permitted merchant | An empty merchant allowlist produced no receipt and no balance change.                                                                                                                                                                                                                                                                                                                 |

Before local catalog mode became the default, the Tavily extension was tested with actual OpenAI and Tavily calls: Alex returned eight sources, two cited observations and one real gift idea; Sophie returned eight sources, three cited observations and three real gift ideas. The integration checks that every displayed citation and receipt source URL resolves to a source returned by Tavily. Counts vary by run. A browser test created a new profile, verified saved fields and the agent request, and rendered linked research using an intercepted response; that browser fixture did not call the providers.

Nine Tavily unit tests cover mode selection, zero Tavily network calls in local catalog mode, generic-query privacy filtering, public HTTP(S) links, bounded source snippets, duplicate handling, missing credentials, partial failures and total failure. Seven deterministic policy tests additionally cover shipping totals, insufficient balance, hard budget limits even after approval, unavailable items, merchant restrictions, structured dislikes, ownership conflicts, late arrival, autopilot off, approval thresholds, duplicate occasions, and funds changing before approval.

These runs demonstrate the checked paths; they do not guarantee that every model response will choose the same gift or correctly interpret every note. The integration test currently asserts the specific coffee and pottery choices, so alternative valid choices can cause a test failure.

Test commands:

```sh
npx tsx --test tests/policy.test.ts tests/research.test.ts tests/cognee.test.ts tests/payments.test.ts
# With a local server and valid OpenAI credentials:
npx tsx tests/agent.integration.ts
# Against production; consumes OpenAI API credit:
TEST_BASE_URL=https://stroy-seven.vercel.app npx tsx tests/agent.integration.ts
```

## Implementation and MVP limits

- **App and server:** Next.js App Router, React, TypeScript, Tailwind CSS, Vercel AI SDK, OpenAI, Zod, Tavily (`@tavily/core`), Cognee REST APIs, and the Stripe SDK. No FastAPI service or Supabase database is used. Default launch progress is streamed as NDJSON; its final signed wallet token is persisted through the same-origin wallet endpoint before the UI accepts completion.
- **Persistence:** Browser localStorage holds profiles, settings and agent results. Local Cognee is disabled unless `COGNEE_ENABLED=true`; production enables it when its key is present unless explicitly disabled. When enabled, profile edits additionally save timestamped snapshots to a per-person dataset scoped by a browser memory cookie; gift runs can retrieve that memory. A compressed, signed, HTTP-only cookie holds wallet state and six recent receipts for up to seven days. This is a per-browser demo, not a shared account.
- **Ledger limits:** Signing detects cookie modification, but does not prevent replay, simultaneous requests using the same balance snapshot, or a reset by clearing cookies. Duplicate detection is limited to retained receipts. Stripe idempotency prevents duplicate execution of the same receipt, but cannot deduplicate separately created receipts from replayed browser snapshots. Live funds require durable authenticated state.
- **Evidence limits:** The model is asked to quote the profile, but code does not validate quote fidelity. The activity view records application events, not a complete provider transcript or hidden model reasoning. P1 availability is enforced but is not currently appended as a successful receipt rule.
- **Run cap:** Twenty completed agent runs per wallet session. This is a demo cap rather than a durable public rate limit.
- **Occasions:** Dates are editable and visible; there is no scheduler, automatic occasion trigger or email reminder. A user currently starts each run.

## Stripe sandbox payment requirements

- Use `PAYMENT_PROVIDER=stripe`, a test/sandbox `STRIPE_SECRET_KEY`, and a server-owned `STRIPE_MERCHANT_ACCOUNTS` map. `PAYMENT_PROVIDER=mock` explicitly selects simulation. Live keys are rejected and configured Stripe failures never silently fall back to mock funds.
- Resolve destinations only from canonical catalog merchants. The model, web research and profile cannot choose a bank account or connected-account ID.
- All four fictional merchant labels currently share one representative Stripe sandbox recipient. They are not four independently onboarded sellers. The setup script validates recipients against the current platform key, reuses an active recipient, and otherwise provides a test onboarding link. Stripe-owned onboarding and any CAPTCHA require completion in the browser before transfers can succeed. Existing GBP funds are preserved; setup does not top the balance up after each gift.
- Create a GBP Connect transfer for the validated total, using the receipt ID as the stable transaction idempotency key. Preserve the policy rules and decision metadata.
- Mark paid only after a matching sandbox transfer is confirmed. Show transfer ID, Dashboard link, destination and platform GBP balance before/after when available. Keep failed and processing states explicit; Check payment retries the same processing receipt.
- Distinguish the £300 browser spending allowance from actual available platform sandbox funds. No real checkout, shipping, subscriptions, scheduling or unattended payment is implemented.

Payment contract tests cover test-key enforcement, canonical destinations and totals, approval requirements, insufficient allowance and sandbox balance, transfer confirmation, idempotent retry, failed and ambiguous outcomes, and explicit mock mode. These mocked contract checks complement the live sandbox transaction evidence recorded during a demonstration.

## Remaining requirements

1. **Durable payment state:** Before introducing live funds, use authenticated storage, atomic balance changes, durable idempotency and complete occasion history. Browser cookies are insufficient for a financial ledger.
2. **Live purchasing eligibility:** Verify seller identity, checkout total, stock, delivery and payment eligibility before an external research result becomes purchasable. Stripe transfers alone do not order products from arbitrary shops.
3. **Reliable evidence:** Validate quoted evidence against supplied text and distinguish confirmed preferences from hypotheses.

The current MVP is intentionally click-driven: personal context → visible agent research → enforceable policy decision → Stripe sandbox transfer or human approval → an understandable receipt. There are no subscriptions or scheduled purchases.
