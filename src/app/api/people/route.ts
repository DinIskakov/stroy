import { z } from "zod";
import { profileSchema } from "@/lib/profile-schema";
import { personDataset, rememberPerson, recallPerson } from "@/lib/cognee";
import { memoryScope } from "@/lib/memory-session";

export const maxDuration = 60;
const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("save"), profile: profileSchema }),
  z.object({
    action: z.literal("recall"),
    id: z.string().min(1).max(80),
    name: z.string().min(1).max(80),
  }),
]);

export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin)
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
        { error: "Please check the person's details." },
        { status: 400 },
      );
    const body = parsed.data;
    const scope = await memoryScope(body.action === "save");
    if (!scope)
      return Response.json(
        { error: "Save someone to Cognee first." },
        { status: 404 },
      );
    if (body.action === "save")
      return Response.json(
        await rememberPerson(
          personDataset(scope, body.profile.id),
          body.profile,
        ),
      );
    return Response.json(
      { memory: await recallPerson(personDataset(scope, body.id), body.name) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Memory request failed.",
      },
      { status: 502 },
    );
  }
}
