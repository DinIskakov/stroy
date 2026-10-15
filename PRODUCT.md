# GiftPilot — AI Gift Concierge

An AI-powered gifting assistant that understands the people in your life, discovers thoughtful gifts, and helps you buy them on time. Built for the **Briefcase × Stripe hackathon** (Track 01: Agents that Spend).

## How it works

1. **Add people:** Create profiles for friends, partners, or family with interests, notes, links, dislikes, and gift budgets.
2. **Set occasions:** Add birthdays, anniversaries, or custom events, with reminders you control.
3. **Discover interests:** An LLM extracts explicit and inferred preferences from user-provided information, keeping brief evidence for each.
4. **Find gifts:** The agent searches real products and checks relevant current trends, prices, and availability.
5. **Recommend & buy:** It ranks gift ideas, explains its choices, and makes a **Stripe test-mode** purchase within a defined spending policy.

## Simple MVP recommendation algorithm

No model training or complex recommendation system:

1. Use an LLM to create a structured list of interests, dislikes, and items already owned.
2. Generate product search queries from the strongest interests and occasion.
3. Fetch product candidates and optionally add a few trend-inspired candidates from web search.
4. **Filter** anything over budget, already owned, unavailable, or contrary to dislikes.
5. **Rank** the rest using a simple score: **interest match (50%) + occasion fit (20%) + value (20%) + trend relevance (10%)**.
6. Show the top 3–5 gifts with short, evidence-based explanations.

## MVP scope

- Multi-person dashboard and editable profiles
- Occasion dates and configurable email reminders
- AI interest extraction from descriptions and supplied links/text
- Web-powered product discovery and trend signals
- Ranked gift cards with product links and reasoning
- Spending rules: budget cap and approval/allowed-purchase checks
- **Stripe test-mode payment** through a supported demo storefront or test integration, with a transaction log explaining the decision

## Suggested stack

- **Frontend:** Next.js, React, Tailwind CSS
- **Backend:** FastAPI + LLM tool calling
- **Database:** Supabase/PostgreSQL
- **Research:** Web/product search APIs
- **Payments:** Stripe (test mode)
- **Reminders:** Scheduled job + email provider
- **Optional:** Cognee for persistent preference memory

## Demo

Add a friend → provide a few personal clues → see inferred interests → discover relevant trending products → select the best gift → validate spending policy → execute and explain a Stripe test payment.

> **MVP note:** Stripe cannot buy from arbitrary online shops by itself. Demo payments use a configured test storefront/integration. Only analyse information the user provides or is permitted to access.
