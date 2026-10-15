import { createHash } from "node:crypto";
import type { Profile } from "./data";

export function personDataset(scope: string, profileId: string) {
  return `stroy_${createHash("sha256").update(`${scope}:${profileId}`).digest("hex")}`;
}

async function request(path: string, body: FormData | object) {
  const key = process.env.COGNEE_API_KEY;
  if (!key) throw new Error("Cognee is not configured on this deployment.");
  let response: Response;
  try {
    response = await fetch(
      `${process.env.COGNEE_API_URL || "https://api.cognee.ai"}/api/v1/${path}`,
      {
        method: "POST",
        headers: {
          "X-Api-Key": key,
          ...(body instanceof FormData
            ? {}
            : { "Content-Type": "application/json" }),
        },
        body: body instanceof FormData ? body : JSON.stringify(body),
        cache: "no-store",
        signal: AbortSignal.timeout(25000),
      },
    );
  } catch {
    throw new Error("Could not reach Cognee. Please try again.");
  }
  if (!response.ok) {
    // Never expose upstream bodies: they can contain personal data or credentials.
    throw new Error(
      response.status === 401 || response.status === 403
        ? "Cognee rejected the API key or dataset access."
        : `Cognee request failed (${response.status}). Please try again.`,
    );
  }
  return response.json();
}

export async function rememberPerson(dataset: string, profile: Profile) {
  const form = new FormData();
  form.append("datasetName", dataset);
  form.append(
    "data",
    new Blob(
      [
        JSON.stringify({
          recordedAt: new Date().toISOString(),
          ...profile,
        }),
      ],
      { type: "text/plain" },
    ),
    `${crypto.randomUUID()}.txt`,
  );
  await request("add", form);
  try {
    await request("cognify", { datasets: [dataset], run_in_background: true });
    return { message: "Saved to Cognee. Memory indexing is queued." };
  } catch {
    return {
      message:
        "Saved to Cognee, but indexing could not start. Save again to retry indexing.",
    };
  }
}

export async function recallPerson(dataset: string, name: string) {
  return request("search", {
    datasets: [dataset],
    query: `What do we know about ${name}'s preferences, important dates, relationship and gift ideas? Prefer the most recently recorded facts.`,
    search_type: "GRAPH_COMPLETION",
  });
}
