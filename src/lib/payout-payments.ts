import Stripe from "stripe";
import { catalog, type Receipt, type Wallet } from "./data";
import { settle } from "./policy";

async function availableGBP(client: Stripe) {
  const balance = await client.balance.retrieve();
  if (balance.livemode !== false) throw new Error("Sandbox balance required.");
  return balance.available.find((item) => item.currency === "gbp")?.amount || 0;
}

// Outgoing sandbox settlement to the platform's configured test bank, never a model-supplied destination.
export async function executePayoutPayment(
  receipt: Receipt,
  wallet: Wallet,
  client: Stripe,
): Promise<Receipt> {
  const product = catalog.find((p) => p.id === receipt.productId)!;
  // The wallet holds the latest reservation state; a replayed request may carry an older receipt.
  const base =
    wallet.receipts.find((saved) => saved.id === receipt.id)?.payment ||
    receipt.payment;
  let payoutId = base?.type === "payout" ? base.id : undefined;
  let balanceBefore = base?.balanceBefore;
  const allowanceBefore = base?.allowanceBefore ?? wallet.balance;
  const destination =
    base?.destination || process.env.STRIPE_PAYOUT_DESTINATION || undefined;
  try {
    if (destination && !/^ba_[A-Za-z0-9]+$/.test(destination))
      throw new Error("Configure a Stripe test bank account for payouts.");
    if (!payoutId) {
      if (!base) {
        balanceBefore = await availableGBP(client);
        if (receipt.total > balanceBefore)
          throw new Error("Insufficient GBP balance in the Stripe sandbox.");
      }
      const created = await client.payouts.create(
        {
          amount: receipt.total,
          currency: "gbp",
          ...(destination ? { destination } : {}),
          description: `stroy sandbox gift settlement: ${product.name}`,
          metadata: {
            stroy_decision_id: receipt.id,
            product_id: product.id,
            merchant: product.merchant,
            budget_pence: String(receipt.budget),
            auto_limit_pence: String(receipt.policy.autoLimit),
            policy_rules: receipt.rules.map((r) => r.split(" · ")[0]).join(","),
            sandbox: "true",
            payment_flow: "payout",
          },
        },
        { idempotencyKey: `stroy-payout-gift-${receipt.id}` },
      );
      payoutId = created.id;
    }
    const payout = await client.payouts.retrieve(payoutId);
    if (
      payout.livemode !== false ||
      payout.amount !== receipt.total ||
      payout.currency !== "gbp" ||
      payout.type !== "bank_account" ||
      (destination && payout.destination !== destination) ||
      payout.metadata?.stroy_decision_id !== receipt.id
    ) {
      throw new Error("Stripe payout did not match the approved sandbox gift.");
    }
    const accepted =
      ["paid", "pending", "in_transit"].includes(payout.status) &&
      !!payout.balance_transaction;
    const paid = accepted && payout.status === "paid";
    let allowanceDebited = !!base?.allowanceDebited;
    if (accepted && !allowanceDebited) {
      wallet.balance -= receipt.total;
      allowanceDebited = true;
    } else if (
      !accepted &&
      allowanceDebited &&
      ["failed", "canceled"].includes(payout.status)
    ) {
      wallet.balance += receipt.total;
      allowanceDebited = false;
    }
    let balanceAfter: number | undefined;
    try {
      balanceAfter = await availableGBP(client);
    } catch {
      /* Payout confirmation remains authoritative. */
    }
    return settle(
      {
        ...receipt,
        status: paid ? "paid" : accepted ? "processing" : "failed",
        at: new Date().toISOString(),
        payment: {
          provider: "stripe",
          type: "payout",
          id: payout.id,
          status: paid ? "succeeded" : accepted ? "processing" : "failed",
          destination: payout.destination as string,
          balanceBefore,
          balanceAfter,
          allowanceBefore,
          allowanceAfter: wallet.balance,
          allowanceDebited,
          ...(!accepted
            ? {
                error:
                  "Stripe payout was not completed. Its spending allowance reservation has been released.",
              }
            : {}),
        },
      },
      wallet,
    );
  } catch (error) {
    const ambiguous =
      !!payoutId ||
      error instanceof Stripe.errors.StripeConnectionError ||
      error instanceof Stripe.errors.StripeAPIError;
    const message =
      error instanceof Error &&
      /external accounts|test bank|Insufficient GBP/.test(error.message)
        ? error.message
        : ambiguous
          ? "Stripe payout confirmation is pending. Check this same payout again."
          : "Stripe sandbox payout was not confirmed. No new spending allowance was deducted.";
    return settle(
      {
        ...receipt,
        status: ambiguous ? "processing" : "failed",
        payment: {
          provider: "stripe",
          type: "payout",
          ...(payoutId ? { id: payoutId } : {}),
          status: ambiguous ? "processing" : "failed",
          destination,
          balanceBefore,
          allowanceBefore,
          allowanceAfter: wallet.balance,
          allowanceDebited: !!base?.allowanceDebited,
          error: message,
        },
      },
      wallet,
    );
  }
}
