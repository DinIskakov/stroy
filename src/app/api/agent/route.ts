import { z } from "zod";
import { runAgent } from "@/lib/agent";
import { readWallet, saveWallet } from "@/lib/wallet";
import { catalog, type Profile } from "@/lib/data";
import { checkPolicy, settle } from "@/lib/policy";
export const maxDuration = 90;
const profileSchema = z.object({
  id: z.string().max(80),
  name: z.string().min(1).max(80),
  relation: z.string().max(60),
  initials: z.string().max(4),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  occasion: z.string().min(1).max(60),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine((v) => !isNaN(Date.parse(v)), "Invalid date"),
  budget: z.number().int().min(100).max(100000),
  notes: z.string().min(5).max(3000),
  dislikes: z.array(z.string().min(1).max(80)).max(20),
  owned: z.array(z.string().min(1).max(80)).max(20),
  interests: z.array(z.string().max(80)).max(10),
});
const bodySchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("run"),
    profile: profileSchema,
    policy: z.object({
      autoLimit: z.number().int().min(0).max(100000),
      allowedMerchants: z.array(z.string().max(80)).max(10),
      autopilot: z.boolean(),
    }),
  }),
  z.object({
    action: z.enum(["approve", "decline"]),
    receiptId: z.string().uuid(),
  }),
]);
export async function POST(request: Request) {
  if (
    request.headers.get("origin") &&
    new URL(request.headers.get("origin")!).host !== new URL(request.url).host
  )
    return Response.json(
      { error: "Cross-origin requests are not accepted." },
      { status: 403 },
    );
  try {
    const raw = await request.text();
    if (raw.length > 16000)
      return Response.json({ error: "Request too large." }, { status: 413 });
    const parsed = bodySchema.safeParse(JSON.parse(raw));
    if (!parsed.success)
      return Response.json(
        {
          error: "Please check the profile and spending settings.",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    const body = parsed.data;
    const wallet = await readWallet();
    if (body.action === "run") {
      if (!process.env.OPENAI_API_KEY)
        return Response.json(
          { error: "The OpenAI key is not configured on this deployment." },
          { status: 503 },
        );
      if (wallet.runs >= 20)
        return Response.json(
          { error: "This demo session has reached its 20-run limit." },
          { status: 429 },
        );
      if (
        wallet.receipts.some(
          (r) =>
            r.profileId === body.profile.id &&
            r.date === body.profile.date &&
            r.status === "pending",
        )
      )
        return Response.json(
          {
            error:
              "Review the pending gift for this occasion before running again.",
          },
          { status: 409 },
        );
      const result = await runAgent(body.profile, body.policy, wallet);
      wallet.runs++;
      await saveWallet(wallet);
      return Response.json({ result, wallet });
    }
    const receipt = wallet.receipts.find((r) => r.id === body.receiptId);
    if (!receipt || receipt.status !== "pending")
      return Response.json(
        { error: "This approval is no longer pending." },
        { status: 409 },
      );
    if (body.action === "decline") {
      receipt.status = "declined";
      await saveWallet(wallet);
      return Response.json({ wallet, receipt });
    }
    const product = catalog.find((p) => p.id === receipt.productId)!;
    const profile = {
      id: receipt.profileId,
      budget: receipt.budget,
      date: receipt.date,
      dislikes: [],
      owned: [],
    } as unknown as Profile;
    const check = checkPolicy(product, profile, receipt.policy, wallet, true);
    if (!check.allowed)
      return Response.json({ error: check.reason }, { status: 409 });
    receipt.status = "paid";
    receipt.rules = check.rules;
    receipt.at = new Date().toISOString();
    settle(receipt, wallet);
    await saveWallet(wallet);
    return Response.json({ wallet, receipt });
  } catch (error) {
    console.error(
      "stroy agent request failed:",
      error instanceof Error ? error.message : "Unknown error",
    );
    if (
      error instanceof Error &&
      /expired|incorrect api key|invalid api key/i.test(error.message)
    )
      return Response.json(
        {
          error:
            "The OpenAI API key is expired or invalid. Update the server key to enable your concierge. Your wallet is unchanged.",
        },
        { status: 503 },
      );
    return Response.json(
      {
        error:
          "The concierge could not finish this request. Your wallet was not charged. Please try again.",
      },
      { status: 502 },
    );
  }
}
