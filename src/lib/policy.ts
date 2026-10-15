import {
  type Product,
  type Profile,
  type Policy,
  type Wallet,
  type Receipt,
} from "./data";
export function checkPolicy(
  product: Product,
  profile: Profile,
  policy: Policy,
  wallet: Wallet,
  approved = false,
) {
  const total = product.price + product.shipping;
  const rules: string[] = [];
  const fail = (reason: string) => ({
    allowed: false,
    approval: false,
    reason,
    rules,
    total,
  });
  if (!product.available) return fail("P1 · This item is unavailable.");
  if (!policy.allowedMerchants.includes(product.merchant))
    return fail("P2 · Merchant is not on your approved list.");
  rules.push("P2 · Approved merchant");
  if (total > profile.budget)
    return fail("P3 · Total including delivery exceeds the recipient budget.");
  rules.push("P3 · Within recipient budget, including delivery");
  if (total > wallet.balance)
    return fail("P4 · Insufficient mock wallet balance.");
  rules.push("P4 · Sufficient wallet balance");
  const text = `${product.name} ${product.tags.join(" ")}`.toLowerCase();
  if (profile.dislikes.some((x) => text.includes(x.toLowerCase())))
    return fail("P5 · Conflicts with a stated dislike.");
  if (profile.owned.some((x) => text.includes(x.toLowerCase())))
    return fail("P5 · Recipient already owns this item.");
  rules.push("P5 · No stated dislikes or owned-item conflicts");
  if (
    wallet.receipts.some(
      (x) =>
        x.profileId === profile.id &&
        x.date === profile.date &&
        x.status === "paid" &&
        (wallet.paymentProvider !== "stripe" ||
          x.payment?.provider === "stripe"),
    )
  )
    return fail("P6 · A gift has already been purchased for this occasion.");
  rules.push("P6 · No duplicate occasion purchase");
  if (
    Date.now() + product.days * 86400000 >
    new Date(`${profile.date}T23:59:59Z`).getTime()
  )
    return fail("P7 · Estimated arrival is after the occasion.");
  rules.push("P7 · Estimated delivery before occasion");
  const approval = !approved && (!policy.autopilot || total > policy.autoLimit);
  rules.push(
    approval
      ? "P8 · Human approval required"
      : approved
        ? "P8 · Explicit human approval received"
        : "P8 · Within automatic spending limit",
  );
  return {
    allowed: true,
    approval,
    reason: approval
      ? "Waiting for your approval."
      : "All spending checks passed.",
    rules,
    total,
  };
}
export function settle(receipt: Receipt, wallet: Wallet) {
  if (receipt.status === "paid" && !receipt.payment?.allowanceDebited)
    wallet.balance -= receipt.total;
  wallet.receipts = [
    receipt,
    ...wallet.receipts.filter((r) => r.id !== receipt.id),
  ].slice(0, 12);
  return receipt;
}
