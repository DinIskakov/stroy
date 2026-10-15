import { memoryScope } from "@/lib/memory-session";
import { profileSchema } from "@/lib/profile-schema";
import { z } from "zod";
import { runAgent } from "@/lib/agent";
import { readWallet, saveWallet, encodeWallet } from "@/lib/wallet";
import {
  catalog,
  type Profile,
  type ProgressEvent,
  type AgentResult,
} from "@/lib/data";
import { checkPolicy } from "@/lib/policy";
import { executePayment, paymentInfo, paymentProvider } from "@/lib/payments";
export const maxDuration = 180;
const schema = z.discriminatedUnion("action", [
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
    action: z.enum(["approve", "decline", "retry"]),
    receiptId: z.string().uuid(),
  }),
]);
function errorMessage(error: unknown) {
  if (
    error instanceof Error &&
    /expired|incorrect api key|invalid api key/i.test(error.message)
  )
    return "The OpenAI key is expired or invalid. Update the server key to continue.";
  return "The agent could not complete this request. Check the payment receipt before retrying.";
}
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
    let input: unknown;
    try {
      input = JSON.parse(raw);
    } catch {
      return Response.json({ error: "Invalid JSON." }, { status: 400 });
    }
    const parsed = schema.safeParse(input);
    if (!parsed.success)
      return Response.json(
        { error: "Please check the profile and spending rules." },
        { status: 400 },
      );
    const body = parsed.data;
    const wallet = await readWallet();
    wallet.paymentProvider = paymentProvider();
    if (body.action === "run") {
      if (!process.env.OPENAI_API_KEY)
        return Response.json(
          { error: "The OpenAI key is not configured." },
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
            (r.status === "pending" || r.status === "processing"),
        )
      )
        return Response.json(
          {
            error:
              "Resolve the pending gift or payment for this occasion first.",
          },
          { status: 409 },
        );
      const runBody = body;
      const scope = await memoryScope();
      async function run(emit?: (event: ProgressEvent) => void) {
        const result: AgentResult = await runAgent(
          runBody.profile,
          runBody.policy,
          wallet,
          scope,
          emit,
        );
        if (result.receipt?.status === "processing") {
          emit?.({
            title:
              paymentProvider() === "stripe"
                ? "Sending the sandbox payment"
                : "Completing your payment",
            detail:
              "Rechecking funds and paying only the approved test merchant.",
            kind: "info",
            stage: "payment",
          });
          if (request.signal.aborted)
            throw new Error("Request cancelled before payment.");
          result.receipt = await executePayment(result.receipt, wallet);
          const paid = result.receipt.status === "paid";
          result.summary = paid
            ? result.receipt.payment?.provider === "stripe"
              ? "Your gift is paid in the Stripe sandbox. The transfer and balance change are recorded below."
              : "Your demo payment went through. Your gift is confirmed and your balance has been updated."
            : result.receipt.payment?.error ||
              "Payment is not confirmed. No gift has been marked paid.";
          const event: ProgressEvent = {
            title: paid ? "Payment confirmed" : "Payment needs attention",
            detail: paid
              ? `${result.receipt.payment?.provider === "stripe" ? "Stripe sandbox transfer" : "Demo payment"} completed.`
              : result.summary,
            kind: paid ? "success" : "warning",
            stage: "payment",
          };
          result.trace.push(event);
          emit?.(event);
        }
        wallet.runs++;
        emit?.({
          title:
            result.receipt?.status === "pending"
              ? "Ready for your approval"
              : "Your gift research is ready",
          detail:
            result.receipt?.status === "pending"
              ? "No funds move until you approve."
              : "Sources, choices and spending decisions are ready to review.",
          kind: "success",
          stage: "complete",
        });
        return { result, wallet: { ...wallet, ...(await paymentInfo()) } };
      }
      if (request.headers.get("accept")?.includes("application/x-ndjson")) {
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          async start(controller) {
            const send = (event: unknown) => {
              try {
                controller.enqueue(
                  encoder.encode(JSON.stringify(event) + "\n"),
                );
              } catch {}
            };
            try {
              const data = await run((event) =>
                send({ type: "progress", event }),
              );
              send({
                type: "result",
                ...data,
                walletToken: encodeWallet(wallet),
              });
            } catch (error) {
              console.error(
                "Agent stream failed:",
                error instanceof Error ? error.message : "Unknown error",
              );
              send({ type: "error", error: errorMessage(error) });
            } finally {
              try {
                controller.close();
              } catch {}
            }
          },
        });
        return new Response(stream, {
          headers: {
            "Content-Type": "application/x-ndjson; charset=utf-8",
            "Cache-Control": "no-store, no-transform",
            "X-Accel-Buffering": "no",
          },
        });
      }
      const data = await run();
      await saveWallet(wallet);
      return Response.json(data);
    }
    const receipt = wallet.receipts.find((r) => r.id === body.receiptId);
    if (
      !receipt ||
      (body.action === "retry"
        ? receipt.status !== "processing"
        : receipt.status !== "pending")
    )
      return Response.json(
        { error: "This decision is no longer pending." },
        { status: 409 },
      );
    if (body.action === "decline") {
      receipt.status = "declined";
      await saveWallet(wallet);
      return Response.json({
        wallet: { ...wallet, ...(await paymentInfo()) },
        receipt,
      });
    }
    const product = catalog.find((p) => p.id === receipt.productId)!;
    const profile = {
      id: receipt.profileId,
      budget: receipt.budget,
      date: receipt.date,
      dislikes: receipt.preferences?.dislikes || [],
      owned: receipt.preferences?.owned || [],
    } as unknown as Profile;
    const check = checkPolicy(
      product,
      profile,
      receipt.policy,
      wallet,
      body.action === "approve" || Boolean(receipt.approvedAt),
    );
    if (!check.allowed || check.approval)
      return Response.json({ error: check.reason }, { status: 409 });
    const next = await executePayment(
      {
        ...receipt,
        status: "processing",
        rules: check.rules,
        ...(body.action === "approve"
          ? { approvedAt: new Date().toISOString() }
          : {}),
      },
      wallet,
    );
    await saveWallet(wallet);
    return Response.json({
      wallet: { ...wallet, ...(await paymentInfo()) },
      receipt: next,
    });
  } catch (error) {
    console.error(
      "Agent request failed:",
      error instanceof Error ? error.message : "Unknown error",
    );
    return Response.json({ error: errorMessage(error) }, { status: 502 });
  }
}
