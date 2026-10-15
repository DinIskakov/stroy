import { createHmac, timingSafeEqual } from "node:crypto";
import { deflateSync, inflateSync } from "node:zlib";
import { cookies } from "next/headers";
import { type Wallet } from "./data";
const initial = (): Wallet => {
  const configured = Number(process.env.SPENDING_ALLOWANCE_PENCE || 30000);
  const balance =
    Number.isSafeInteger(configured) &&
    configured >= 0 &&
    configured <= 10000000
      ? configured
      : 30000;
  return { balance, receipts: [], runs: 0 };
};
function secret() {
  const s = process.env.WALLET_SECRET || process.env.OPENAI_API_KEY;
  if (!s) throw new Error("Wallet signing secret is not configured.");
  return s;
}
export function encodeWallet(wallet: Wallet) {
  const compact = {
    ...wallet,
    receipts: wallet.receipts.slice(0, 6).map((r) => ({
      ...r,
      reason: r.reason.slice(0, 200),
      evidence: r.evidence.slice(0, 120),
    })),
  };
  const payload = deflateSync(Buffer.from(JSON.stringify(compact))).toString(
    "base64url",
  );
  return `${payload}.${createHmac("sha256", secret()).update(payload).digest("base64url")}`;
}
export function decodeWallet(value: string): Wallet | undefined {
  try {
    const [payload, signature] = value.split(".");
    const expected = createHmac("sha256", secret())
      .update(payload)
      .digest("base64url");
    if (
      signature.length !== expected.length ||
      !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
    )
      return;
    return JSON.parse(
      inflateSync(Buffer.from(payload, "base64url"), {
        maxOutputLength: 64000,
      }).toString(),
    );
  } catch {
    return;
  }
}
export async function readWallet(): Promise<Wallet> {
  const value = (await cookies()).get("stroy-wallet")?.value;
  return value ? decodeWallet(value) || initial() : initial();
}
export async function saveWallet(wallet: Wallet) {
  (await cookies()).set("stroy-wallet", encodeWallet(wallet), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}
