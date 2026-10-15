# stroy — The art of giving

## Purpose and current release

stroy is a personal gifting concierge. It turns the small things someone tells you about a person into a considered gift, then acts within spending rules you control.

The problem: remembering an occasion is only the beginning. Choosing a relevant gift, avoiding something the person already owns, keeping within budget, and handling the purchase all take attention. stroy combines recipient context and controlled purchasing in one flow, with a reason behind each decision.

This release is a working hackathon MVP for **Briefcase × Stripe — Track 01: Agents that Spend**. The live app is https://stroy-seven.vercel.app. Code is at https://github.com/DinIskakov/stroy; pushes to `main` automatically deploy to Vercel.

**Current boundary:** AI decisions are real OpenAI calls through the Vercel AI SDK. Tavily web research is live and returns source-linked trend observations and gift ideas. The eight purchasable demo products, four demo merchants, prices, stock flags, delivery estimates, wallet and purchases are fictional. No real money moves. The hackathon requires a Stripe test-mode money movement in the demo; this mock version does not yet satisfy that requirement.

## Product requirements and why they matter

| Requirement                      | Current behavior                                                                                                                                       | Why we need it                                                                                          |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Know the recipient               | Create and edit people, relationships, notes, interests, explicit dislikes, owned items, occasions, dates and budgets.                                 | Personal context makes a gift relevant and helps avoid predictable mistakes.                            |
| Explain inferred preferences     | The model extracts up to six interests with supporting text and marks each as stated or inferred.                                                      | Users should understand the basis for a recommendation and be able to correct the source profile.       |
| Offer a considered shortlist     | The model proposes one to three eligible gifts with reasons, evidence and subjective fit scores.                                                       | Gives users visibility into the choice without overwhelming them.                                       |
| Act autonomously within rules    | The agent chooses and attempts one mock purchase per run. Eligible purchases at or below the automatic limit can complete independently.               | Demonstrates an agent that can spend under a bounded mandate.                                           |
| Escalate to the user             | Purchases above the automatic limit, or all purchases with autopilot off, wait for approval. Users can approve or decline.                             | Preserves user control over higher-value or manually reviewed decisions.                                |
| Enforce hard constraints in code | Server tools check the catalog, budget, balance, merchant, preferences, duplicate occasion purchases and arrival estimate.                             | Model reasoning alone is insufficient to enforce a spending policy.                                     |
| Explain the spend                | Show extracted interests, shortlist reasoning, activity entries and receipts containing evidence, policy snapshot, rules, amount, merchant and status. | Makes “why did you pay this?” answerable and makes mistakes easier to inspect.                          |
| Keep the demo usable             | Profiles, policy settings and agent results persist in the browser; a signed cookie persists the mock wallet. Responsive desktop/mobile UI.            | Lets a user complete and revisit a demonstration without setting up accounts or payment infrastructure. |

## Agent workflow

A user starts a run for a recipient. The server sends that profile, the selected policy and wallet balance to OpenAI using the Vercel AI SDK. The default model is `gpt-4.1-mini`, configurable through `OPENAI_MODEL`.

1. **`discoverGifts`:** Record extracted interests and evidence. Search Tavily in parallel for recent trend inspiration (past year) and product/gift pages, up to four sources per query. Build queries from up to three generic interests and the budget, stripping recipient name tokens, emails, URLs and phone-like strings. Evaluate all eight demo catalog entries using server policy checks; return eligible products, rejection reasons and web sources.
2. **`presentShortlist`:** Record up to three cited trend observations, three web gift ideas and three demo recommendations. Server code validates citation IDs against returned sources and removes unknown or ineligible demo product IDs. A shortlist requires discovery first. Live web ideas link to source pages; they are research-only and cannot be purchased with the mock wallet.
3. **`purchaseGift`:** Select a product from the validated shortlist, recheck policy, and either record a paid mock receipt or queue a pending approval. Only one receipt can be created per agent run.
4. **Explain the result:** Generate a short summary alongside the structured decision trace and receipt.
5. **If pending:** Explicit approval rechecks the applicable server rules and deducts the mock funds once. Declining changes the receipt status without deducting funds. An already resolved receipt cannot be approved again through the normal API flow.

The agent loop permits up to six generation steps and has a 85-second timeout. Failed requests do not persist wallet deductions. The summary and evidence are model-generated; they are not independently verified quotes or formal proofs.

**Ranking:** the current agent uses contextual judgment and subjective scores from 0–100. It can use cited web research as inspiration, but does not implement fixed 50/20/20/10 weights, calibrated trend scoring, model training, or a separate recommendation model. Personal relevance takes priority over popularity.

## Profile → interests → research → gift

1. Create or edit a profile with notes about the person, their interests, dislikes, owned items, occasion and budget. “Find a gift” starts the pipeline; saving a profile alone does not trigger paid API calls.
2. OpenAI interprets the notes as stated and inferred interests with evidence. Edit the source profile and rerun to correct the result.
3. Tavily searches public web content for relevant trends and real gift ideas. It receives generic interest queries and the budget, not the full profile or notes. Name/contact filtering reduces accidental identity exposure; it is not a general-purpose personal-data redaction guarantee.
4. OpenAI uses returned snippets to explain which trends and gift ideas could fit. Trends are signals from retrieved articles, not proof of popularity or evidence about the recipient. All displayed citations must resolve to a returned source ID.
5. The UI presents live gift ideas with links and a separate demo shortlist for simulated wallet purchases. Real merchant links do not become approved payment counterparties.

Tavily search returns page snippets rather than fully reading every linked page. No direct profile scraping, social account access, or fetching URLs from notes is implemented. Source retrieval time is recorded; a page may still be stale. The app does not validate live checkout totals, stock or arrival estimates. Users must check seller details before buying externally.

Each run allows one research call, with two parallel basic searches and 15-second timeouts. One failed search retains the successful results and marks research partial. Missing credentials, failures or no usable sources produce an unavailable state; the agent may continue using the demo catalog without claiming live findings.

Retrieved text is untrusted data and cannot authorize spending or change the policy. OpenAI still receives the full supplied profile for interpretation. Explicit dislikes and owned-item fields receive deterministic checks; preferences mentioned only in prose depend on model understanding.

## Written spending policy

Defaults: **£300 starting mock balance**, **£50 automatic purchase limit**, autopilot **on**, and all four demo merchants approved: **Origin Studio, Still & Form, Field Notes, Clay House**. Alex has a **£65 recipient budget**; Sophie has **£120**.

All amounts are stored as integer pence. Purchase totals include the catalog price plus shipping. Taxes are not separately modeled. Users can change the automatic limit, toggle autopilot, and select merchants in **Spending rules**; recipient budgets are edited on profiles.

| Rule                            | Enforcement                                                                                                                                        | Why it exists                                                                                       |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| P1 — Availability               | Reject a product whose catalog availability flag is false.                                                                                         | Avoid attempting an unavailable gift.                                                               |
| P2 — Approved merchant          | Product merchant must be in the policy allowlist.                                                                                                  | Constrain where the agent may spend.                                                                |
| P3 — Recipient budget           | Price plus shipping must not exceed the recipient budget, including after approval.                                                                | Make the user’s total spending cap binding.                                                         |
| P4 — Wallet funds               | Total must not exceed the current mock balance. Approval rechecks funds.                                                                           | Prevent overspending the available demo balance.                                                    |
| P5 — Preferences and ownership  | Case-insensitive substring checks compare structured dislikes and owned items against product names and tags.                                      | Reject known unsuitable or already-owned items. This is keyword matching, not a semantic guarantee. |
| P6 — One paid gift per occasion | Reject if a retained paid receipt has the same recipient ID and occasion date. The API also blocks a new run while a matching approval is pending. | Avoid repeated purchases during the normal demo flow.                                               |
| P7 — Arrival                    | Current time plus catalog delivery days must be on or before the occasion date’s end in UTC.                                                       | Avoid selecting a gift estimated to arrive late. This is not a real delivery promise.               |
| P8 — Approval                   | Autopilot must be on and total must be at or below the automatic limit for automatic spending. Otherwise explicit approval is required.            | Bound autonomy while allowing the best suitable gift to go to review.                               |

Approval overrides only the automatic-purchase requirement; it cannot override budget, balance, merchant, availability, duplicate-purchase or delivery checks. Pending receipts retain their original policy and budget. Changes to settings do not retroactively modify them.

**Approval limitation:** initial discovery and purchase check P5 against the profile. The approval endpoint currently reconstructs the recipient without dislikes or owned items, so it does not revalidate those preferences after a profile edit. A future implementation should save the relevant profile snapshot and define whether approvals use the original or latest preferences.

Pending requests do not deduct or reserve money. The balance can therefore change before approval, and sufficient funds must be checked again.

## Tested default scenarios

The integration test used actual OpenAI tool calls and HTTP requests with a cookie jar. It passed locally and against the deployed Vercel app on 15 October 2026.

| Scenario              | Observed behavior and assertions                                                                                                                                                                                                                                                                                                                                                       |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Alex — best friend    | Notes mention specialty coffee and trying beans from different origins; a grinder and camera are already owned, and alcohol is disliked. Agent selected the coffee discovery set: £32 + £4 shipping = **£36**. It was under the £65 budget and £50 automatic limit. Paid receipt created; wallet **£300 → £264**. Test also checked that recommendations and activity entries existed. |
| Sophie — girlfriend   | Notes mention handmade ceramics and wanting a pottery class together. Agent selected the two-person workshop for **£88**. It fit the £120 budget but exceeded the £50 automatic limit. Pending receipt created; wallet stayed **£264**. Explicit approval paid once; wallet **£264 → £176**. Repeating approval returned HTTP 409.                                                     |
| Invalid budget        | A negative recipient budget returned HTTP 400.                                                                                                                                                                                                                                                                                                                                         |
| No affordable gift    | A £1 recipient budget produced no receipt and no balance change.                                                                                                                                                                                                                                                                                                                       |
| No permitted merchant | An empty merchant allowlist produced no receipt and no balance change.                                                                                                                                                                                                                                                                                                                 |

Seven Tavily unit tests cover generic-query privacy filtering, public HTTP(S) links, bounded source snippets, duplicate handling, missing credentials, partial failures and total failure. Seven deterministic policy tests additionally cover shipping totals, insufficient balance, hard budget limits even after approval, unavailable items, merchant restrictions, structured dislikes, ownership conflicts, late arrival, autopilot off, approval thresholds, duplicate occasions, and funds changing before approval.

These runs demonstrate the checked paths; they do not guarantee that every model response will choose the same gift or correctly interpret every note. The integration test currently asserts the specific coffee and pottery choices, so alternative valid choices can cause a test failure.

Test commands:

```sh
npx tsx --test tests/policy.test.ts tests/research.test.ts
# With a local server and valid OpenAI credentials:
npx tsx tests/agent.integration.ts
# Against production; consumes OpenAI API credit:
TEST_BASE_URL=https://stroy-seven.vercel.app npx tsx tests/agent.integration.ts
```

## Implementation and MVP limits

- **App and server:** Next.js App Router, React, TypeScript, Tailwind CSS, Vercel AI SDK, OpenAI, Zod, and Tavily (`@tavily/core`). No FastAPI service, Supabase database, or Cognee integration is currently used.
- **Persistence:** Browser localStorage holds profiles, settings and agent results. A compressed, signed, HTTP-only cookie holds wallet state and six recent receipts for up to seven days. This is a per-browser demo, not a shared account.
- **Ledger limits:** Signing detects cookie modification, but does not prevent replay, simultaneous requests using the same balance snapshot, or a reset by clearing cookies. Duplicate detection is limited to retained receipts. This is not ready to control real funds.
- **Evidence limits:** The model is asked to quote the profile, but code does not validate quote fidelity. The activity view records application events, not a complete provider transcript or hidden model reasoning. P1 availability is enforced but is not currently appended as a successful receipt rule.
- **Run cap:** Twenty completed agent runs per wallet session. This is a demo cap rather than a durable public rate limit.
- **Occasions:** Dates are editable and visible; there is no scheduler, automatic occasion trigger or email reminder. A user currently starts each run.

## Next requirements

1. **Stripe test-mode execution:** Replace mock settlement with a supported Stripe test integration, preserve the same policy gate, and record Stripe transaction identifiers. Required to satisfy the hackathon’s actual money-movement criterion. Stripe alone cannot purchase from arbitrary online shops.
2. **Durable payment state:** Before introducing real funds, use authenticated storage, atomic balance changes, durable idempotency and complete occasion history. Preserve policy and recipient snapshots for approval and audit.
3. **Live purchasing eligibility:** Tavily discovery now provides source URLs and timestamps. Add verification of seller identity, checkout price, stock, delivery and merchant eligibility before any external product becomes purchasable. Needed to connect live inspiration to reliable execution.
4. **Reliable evidence:** Validate quoted evidence against supplied text and distinguish confirmed preferences from hypotheses. Needed for trustworthy explanations.
5. **Scheduled occasions and reminders:** Add opt-in scheduling and notifications once the purchase flow and persistence support unattended operation.

The immediate goal is a demonstrable MVP: personal context → AI-selected gift → enforceable policy decision → automatic mock purchase or human approval → an understandable receipt.
