import Stripe from "stripe";
import { catalog, type Receipt, type Wallet } from "./data";
import { settle } from "./policy";

export function paymentProvider(): "mock" | "stripe" {
  if (process.env.PAYMENT_PROVIDER === "mock") return "mock";
  return process.env.PAYMENT_PROVIDER === "stripe" ||
    process.env.STRIPE_SECRET_KEY
    ? "stripe"
    : "mock";
}
export function sandboxClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || !/^(sk|rk)_test_/.test(key))
    throw new Error(
      "A Stripe sandbox/test secret key is required. Live keys are not accepted.",
    );
  return new Stripe(key, {
    maxNetworkRetries: 1,
    timeout: 12000,
    httpClient: Stripe.createFetchHttpClient(),
  });
}
export function merchantAccounts(): Record<string, string> {
  try {
    return JSON.parse(process.env.STRIPE_MERCHANT_ACCOUNTS || "{}");
  } catch {
    throw new Error("Stripe test merchant mapping is invalid.");
  }
}
export async function sandboxBalance(client = sandboxClient()) {
  const b = await client.balance.retrieve();
  if (b.livemode) throw new Error("Live Stripe balances are not supported.");
  return b.available.find((b) => b.currency === "gbp")?.amount || 0;
}
export async function paymentInfo() {
  const provider = paymentProvider();
  if (provider === "mock") return { paymentProvider: provider };
  try {
    return {
      paymentProvider: provider,
      stripeBalance: await sandboxBalance(),
      stripeConfigured: true,
    };
  } catch {
    return { paymentProvider: provider, stripeConfigured: false };
  }
}

// Only canonical catalog merchants can resolve to a destination. Model/user input cannot supply an account.
export async function executePayment(
  receipt: Receipt,
  wallet: Wallet,
): Promise<Receipt> {
  const existing = wallet.receipts.find(
    (r) => r.id === receipt.id && r.status === "paid",
  );
  if (existing) return existing;
  if (receipt.status === "pending" || receipt.status === "declined")
    throw new Error("Payment needs explicit approval first.");
  const product = catalog.find((p) => p.id === receipt.productId);
  if (
    !product ||
    receipt.total !== product.price + product.shipping ||
    receipt.total <= 0 ||
    receipt.total > wallet.balance
  )
    throw new Error(
      "Payment amount does not match the approved gift or available budget.",
    );
  const provider = paymentProvider();
  if (provider === "mock")
    return settle(
      {
        ...receipt,
        status: "paid",
        payment: { provider: "mock", status: "succeeded" },
      },
      wallet,
    );
  let client: Stripe;
  let destination: string;
  try {
    client = sandboxClient();
    destination = merchantAccounts()[product.merchant];
    if (!destination || !/^acct_[A-Za-z0-9]+$/.test(destination))
      throw new Error(
        "Configure a Stripe sandbox connected account for this approved merchant.",
      );
  } catch (error) {
    return settle(
      {
        ...receipt,
        status: "failed",
        payment: {
          provider: "stripe",
          status: "failed",
          error:
            error instanceof Error
              ? error.message
              : "Stripe sandbox is not configured.",
        },
      },
      wallet,
    );
  }
  const base = receipt.payment;
  let balanceBefore = base?.balanceBefore;
  try {
    // On a retry the identical idempotency key is the authority; current funds may already include this transfer.
    if (!base) {
      balanceBefore = await sandboxBalance(client);
      if (receipt.total > balanceBefore)
        throw new Error("Insufficient GBP balance in the Stripe sandbox.");
    }
    const transfer = await client.transfers.create(
      {
        amount: receipt.total,
        currency: "gbp",
        destination,
        description: `stroy sandbox gift: ${product.name}`,
        metadata: {
          stroy_decision_id: receipt.id,
          product_id: product.id,
          merchant: product.merchant,
          budget_pence: String(receipt.budget),
          auto_limit_pence: String(receipt.policy.autoLimit),
          policy_rules: receipt.rules.map((r) => r.split(" · ")[0]).join(","),
          sandbox: "true",
        },
      },
      { idempotencyKey: `stroy-gift-${receipt.id}` },
    );
    if (
      transfer.livemode ||
      transfer.amount !== receipt.total ||
      transfer.currency !== "gbp" ||
      transfer.destination !== destination ||
      transfer.reversed
    )
      throw new Error(
        "Stripe transfer did not match the approved sandbox payment.",
      );
    let balanceAfter: number | undefined;
    try {
      balanceAfter = await sandboxBalance(client);
    } catch {
      /* The confirmed transfer remains authoritative if the balance lookup fails. */
    }
    return settle(
      {
        ...receipt,
        status: "paid",
        at: new Date().toISOString(),
        payment: {
          provider: "stripe",
          type: "transfer",
          id: transfer.id,
          status: "succeeded",
          destination,
          balanceBefore,
          balanceAfter,
        },
      },
      wallet,
    );
  } catch (error) {
    const ambiguous =
      error instanceof Stripe.errors.StripeConnectionError ||
      error instanceof Stripe.errors.StripeAPIError;
    const message =
      error instanceof Error && /Insufficient GBP/.test(error.message)
        ? error.message
        : ambiguous
          ? "Stripe confirmation is delayed. Check this payment again; it uses the same transaction key."
          : "Stripe sandbox transfer failed. No gift has been marked paid.";
    return settle(
      {
        ...receipt,
        status: ambiguous ? "processing" : "failed",
        payment: {
          provider: "stripe",
          type: "transfer",
          status: ambiguous ? "processing" : "failed",
          destination,
          balanceBefore,
          error: message,
        },
      },
      wallet,
    );
  }
}
