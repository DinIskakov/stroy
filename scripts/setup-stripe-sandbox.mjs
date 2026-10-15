process.on('uncaughtException',error=>{console.error(error.message);process.exit(1);});
process.on('unhandledRejection',error=>{console.error(error instanceof Error?error.message:'Sandbox setup failed.');process.exit(1);});
import { readFileSync, writeFileSync } from "node:fs";
import Stripe from "stripe";
process.loadEnvFile(".env.local");
const key = process.env.STRIPE_SECRET_KEY;
if (!key || !/^(sk|rk)_test_/.test(key))
  throw Error("Set a Stripe sandbox/test secret key. Live keys are rejected.");
async function request(path, data, idempotencyKey) {
  const response = await fetch("https://api.stripe.com/v1/" + path, {
    method: data ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${key}`,
      ...(data
        ? {
            "Content-Type": "application/x-www-form-urlencoded",
            "Idempotency-Key": idempotencyKey,
          }
        : {}),
    },
    body: data ? new URLSearchParams(data) : undefined,
  });
  const body = await response.json();
  if (!response.ok)
    throw Error(`${path}: ${body.error?.message || response.status}`);
  return body;
}
const account = await request("account");
console.log("Sandbox account:", account.id);
const stripe = new Stripe(key);
const names = ["Origin Studio", "Still & Form", "Field Notes", "Clay House"];
const mapping = JSON.parse(process.env.STRIPE_MERCHANT_ACCOUNTS || "{}");
for (const name of names) {
  if (mapping[name]) continue;
  const a = await stripe.v2.core.accounts.create(
    {
      display_name: `stroy Demo — ${name}`,
      contact_email: `stroy-${name.toLowerCase().replace(/[^a-z]/g, "")}@example.com`,
      dashboard: "full",
      identity: { country: "gb" },
      defaults: {
        responsibilities: {
          fees_collector: "stripe",
          losses_collector: "stripe",
        },
      },
      configuration: {
        merchant: {capabilities:{card_payments:{requested:true}}},
        recipient: {
          capabilities: {
            stripe_balance: { stripe_transfers: { requested: true } },
          },
        },
      },
      metadata: { stroy_demo: "true" },
    },
    { idempotencyKey: `stroy-merchant-v4-${name.replaceAll(" ", "-")}` },
  );
  mapping[name] = a.id;
  console.log("Test merchant created:", name, a.id);
  let env = readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => !l.startsWith("STRIPE_MERCHANT_ACCOUNTS="))
    .join("\n");
  writeFileSync(
    ".env.local",
    env + `\nSTRIPE_MERCHANT_ACCOUNTS='${JSON.stringify(mapping)}'\n`,
  );
}
const balance = await request("balance");
console.log("Available sandbox funds:", balance.available);
if (!balance.available.some((b) => b.currency === "gbp" && b.amount >= 30000)) {
  const topup = await request(
    "topups",
    {
      amount: "30000",
      currency: "gbp",
      source: "btok_us_verified",
      description: "stroy sandbox demo funding",
    },
    "stroy-sandbox-initial-funding-v1",
  );
  console.log("Sandbox top-up:", topup.id, topup.status);
}
console.log("Setup complete. No live funds or actual gift orders.");
