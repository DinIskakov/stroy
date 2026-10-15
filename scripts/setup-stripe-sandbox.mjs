process.on("uncaughtException", (error) => {
  console.error(error.message);
  process.exit(1);
});
process.on("unhandledRejection", (error) => {
  console.error(
    error instanceof Error ? error.message : "Sandbox setup failed.",
  );
  process.exit(1);
});
import { readFileSync, writeFileSync } from "node:fs";
import Stripe from "stripe";
process.loadEnvFile(".env.local");
const key = process.env.STRIPE_SECRET_KEY;
if (!key || !/^(sk|rk)_test_/.test(key))
  throw Error("Set a Stripe sandbox/test secret key. Live keys are rejected.");
const stripe = new Stripe(key);
const platform = await stripe.accounts.retrieve();
console.log("Sandbox account:", platform.id);

// Funding belongs to the platform and is independent of connected-account onboarding.
const balance = await stripe.balance.retrieve();
if (balance.livemode) throw Error("Live Stripe balances are not supported.");
console.log("Available sandbox funds:", balance.available);
if (
  ![...balance.available, ...balance.pending].some(
    (b) => b.currency === "gbp" && b.amount > 0,
  )
) {
  const payment = await stripe.paymentIntents.create(
    {
      amount: 31000,
      currency: "gbp",
      payment_method: "pm_card_bypassPendingInternational",
      confirm: true,
      automatic_payment_methods: { enabled: true, allow_redirects: "never" },
      description: "stroy sandbox demo funding",
    },
    { idempotencyKey: "stroy-sandbox-gbp-funding-v1" },
  );
  console.log("Sandbox funding payment:", payment.id, payment.status);
  console.log(
    "Funding becomes available shortly; Stripe test processing fees apply.",
  );
}

const names = ["Origin Studio", "Still & Form", "Field Notes", "Clay House"];
const previous = JSON.parse(process.env.STRIPE_MERCHANT_ACCOUNTS || "{}");
const candidates = [];
for (const id of new Set(Object.values(previous))) {
  try {
    // A changed platform key cannot reuse recipients belonging to its predecessor.
    const account = await stripe.accounts.retrieve(id);
    if (account.id !== platform.id) candidates.push(account);
  } catch (error) {
    if (error.statusCode !== 404 && error.code !== "resource_missing")
      throw error;
    console.log("Ignoring merchant from a previous sandbox:", id);
  }
}
const existing = await stripe.accounts.list({ limit: 100 });
for (const account of existing.data) {
  if (
    account.metadata?.stroy_demo === "true" &&
    !candidates.some((a) => a.id === account.id)
  )
    candidates.push(account);
}
let account =
  candidates.find((a) => a.capabilities?.transfers === "active") ||
  candidates.find((a) => a.controller?.stripe_dashboard?.type === "none");
if (!account) {
  const created = await stripe.v2.core.accounts.create(
    {
      display_name: "stroy shared sandbox gift recipient",
      contact_email: "stroy-demo@example.com",
      dashboard: "none",
      identity: {
        country: "gb",
        entity_type: "individual",
        individual: {
          given_name: "Jenny",
          surname: "Rosen",
          date_of_birth: { day: 1, month: 1, year: 1990 },
          address: {
            line1: "address_full_match",
            city: "London",
            postal_code: "W1T 4JF",
            country: "gb",
          },
          email: "stroy-demo@example.com",
          phone: "+447911123456",
        },
      },
      defaults: {
        currency: "gbp",
        profile: {
          business_url: "https://accessible.stripe.com",
          product_description: "Sandbox gift store",
        },
        responsibilities: {
          fees_collector: "stripe",
          losses_collector: "stripe",
        },
      },
      configuration: {
        merchant: {
          mcc: "5999",
          support: { phone: "+447911123456" },
          capabilities: { card_payments: { requested: true } },
        },
        recipient: {
          capabilities: {
            stripe_balance: { stripe_transfers: { requested: true } },
          },
        },
      },
      metadata: { stroy_demo: "true", platform: platform.id },
    },
    { idempotencyKey: `stroy-shared-recipient-v1-${platform.id}` },
  );
  account = await stripe.accounts.retrieve(created.id);
  console.log("Shared test recipient created:", account.id);
}
// All fictional merchant labels use one connected account in this sandbox demo.
// This is a representative test recipient, not four separately onboarded real sellers.
const mapping = Object.fromEntries(names.map((name) => [name, account.id]));
const env = readFileSync(".env.local", "utf8")
  .split("\n")
  .filter((line) => !line.startsWith("STRIPE_MERCHANT_ACCOUNTS="))
  .join("\n");
writeFileSync(
  ".env.local",
  env + `\nSTRIPE_MERCHANT_ACCOUNTS='${JSON.stringify(mapping)}'\n`,
);
console.log(
  "All demo merchants map to the shared sandbox recipient:",
  account.id,
);
console.log("Recipient transfers capability:", account.capabilities?.transfers);
if (account.capabilities?.transfers !== "active") {
  const link = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: "http://localhost:3000/app",
    return_url: "http://localhost:3000/app",
    type: "account_onboarding",
  });
  console.log("Complete Stripe TEST onboarding in your browser:", link.url);
  console.log(
    "If Stripe presents a CAPTCHA, complete it manually. Payments remain blocked until transfers are active.",
  );
}
console.log("Sandbox setup saved. No live funds or real gift orders.");
