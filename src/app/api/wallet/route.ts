import { readWallet, decodeWallet, saveWallet } from "@/lib/wallet";
import { paymentInfo } from "@/lib/payments";
export async function GET() {
  return Response.json(
    { ...(await readWallet()), ...(await paymentInfo()) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return Response.json(
      { error: "Cross-origin requests are not accepted." },
      { status: 403 },
    );
  try {
    const raw = await request.text();
    if (raw.length > 14000)
      return Response.json(
        { error: "Wallet token too large." },
        { status: 413 },
      );
    const { token } = JSON.parse(raw);
    if (typeof token !== "string") throw Error();
    const wallet = decodeWallet(token);
    if (!wallet) throw Error();
    await saveWallet(wallet);
    return Response.json({ saved: true });
  } catch {
    return Response.json(
      { error: "Unable to save the wallet session." },
      { status: 400 },
    );
  }
}
