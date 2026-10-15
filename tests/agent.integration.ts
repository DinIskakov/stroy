import assert from "node:assert/strict";
import { request } from "@playwright/test";
import { defaultPolicy, profiles } from "../src/lib/data";
import type { AgentResult } from "../src/lib/data";
import { publicUrl } from "../src/lib/research";

function assertResearch(result: AgentResult, profileName: string) {
  const research = result.research;
  assert.ok(
    research,
    `${profileName}: agent must research before recommending`,
  );
  const expectWeb = process.env.TEST_RESEARCH_MODE
    ? process.env.TEST_RESEARCH_MODE === "web"
    : (process.env.TEST_BASE_URL || "").startsWith("https://");
  if (!expectWeb) {
    assert.equal(
      research.status,
      "catalog",
      `${profileName}: localhost uses the demo catalog without Tavily`,
    );
    assert.deepEqual(research.queries, []);
    assert.deepEqual(research.sources, []);
    assert.deepEqual(research.insights, []);
    assert.deepEqual(research.gifts, []);
    assert.ok(result.recommendations.every((r) => !r.sourceIds?.length));
    assert.ok(!result.receipt?.sourceUrls?.length);
    console.log(
      `PASS ${profileName}: local catalog mode, zero web queries or invented research`,
    );
    return;
  }
  assert.ok(
    ["complete", "partial"].includes(research.status),
    `${profileName}: Tavily must return live sources, received ${research.status}`,
  );
  assert.equal(research.queries.length, 2);
  assert.ok(
    research.queries.some((q) => q.kind === "trend" && q.status === "ok"),
    `${profileName}: live trend search succeeds`,
  );
  assert.ok(
    research.queries.some((q) => q.kind === "product" && q.status === "ok"),
    `${profileName}: live product search succeeds`,
  );
  assert.ok(
    research.sources.some((s) => s.kind === "trend"),
    `${profileName}: trend source returned`,
  );
  assert.ok(
    research.sources.some((s) => s.kind === "product"),
    `${profileName}: product source returned`,
  );
  assert.ok(
    research.sources.every(
      (s) => publicUrl(s.url) === s.url && s.title && s.snippet,
    ),
  );
  assert.ok(
    research.insights.length > 0,
    `${profileName}: trend observations are displayed`,
  );
  for (const insight of research.insights) {
    assert.ok(insight.sourceIds.length > 0);
    assert.ok(
      insight.sourceIds.every((id) =>
        research.sources.some((s) => s.id === id && s.kind === "trend"),
      ),
      `${profileName}: every insight cites returned trend evidence`,
    );
  }
  assert.ok(
    research.gifts.length > 0,
    `${profileName}: real gift research is displayed`,
  );
  assert.ok(
    research.gifts.every((g) =>
      research.sources.some((s) => s.id === g.sourceId && s.kind === "product"),
    ),
    `${profileName}: every web gift cites a returned product source`,
  );
  for (const recommendation of result.recommendations) {
    assert.ok(
      (recommendation.sourceIds || []).every((id) =>
        research.sources.some((s) => s.id === id),
      ),
      `${profileName}: no invented source IDs`,
    );
  }
  assert.ok(
    (result.receipt?.sourceUrls || []).every((url) =>
      research.sources.some((s) => s.url === url),
    ),
    `${profileName}: receipt links trace back to research`,
  );
  console.log(
    `PASS ${profileName} research: ${research.sources.length} live sources, ${research.insights.length} cited insights, ${research.gifts.length} linked gift ideas`,
  );
}

async function main() {
  const client = await request.newContext({
    baseURL: process.env.TEST_BASE_URL || "http://localhost:3000",
    timeout: 90000,
  });
  const post = async (body: unknown) =>
    client.post("/api/agent", { data: body });
  try {
    const alexResponse = await post({
      action: "run",
      profile: profiles[0],
      policy: defaultPolicy,
    });
    assert.equal(alexResponse.status(), 200, await alexResponse.text());
    const alex = await alexResponse.json();
    assertResearch(alex.result, "Alex");
    assert.equal(alex.result.receipt.status, "paid");
    assert.equal(alex.result.receipt.productId, "coffee");
    assert.equal(alex.wallet.balance, 26400);
    assert.ok(alex.result.trace.length >= 3);
    assert.ok(alex.result.recommendations.length >= 1);
    console.log(
      "PASS Alex: coffee selected and £36 deducted from £300 mock balance",
    );
    const sophieResponse = await post({
      action: "run",
      profile: profiles[1],
      policy: defaultPolicy,
    });
    assert.equal(sophieResponse.status(), 200, await sophieResponse.text());
    const sophie = await sophieResponse.json();
    assertResearch(sophie.result, "Sophie");
    assert.equal(sophie.result.receipt.status, "pending");
    assert.equal(sophie.result.receipt.productId, "pottery");
    assert.equal(sophie.wallet.balance, 26400);
    const approved = await post({
      action: "approve",
      receiptId: sophie.result.receipt.id,
    });
    assert.equal(approved.status(), 200, await approved.text());
    const approval = await approved.json();
    assert.equal(approval.receipt.status, "paid");
    assert.equal(approval.wallet.balance, 17600);
    const duplicate = await post({
      action: "approve",
      receiptId: sophie.result.receipt.id,
    });
    assert.equal(duplicate.status(), 409);
    console.log(
      "PASS Sophie: pottery requires approval, £88 deducted once; duplicate approval rejected",
    );
    const invalid = await post({
      action: "run",
      profile: { ...profiles[0], budget: -1 },
      policy: defaultPolicy,
    });
    assert.equal(invalid.status(), 400);
    for (const [name, profile, policy] of [
      [
        "insufficient budget",
        { ...profiles[0], id: "budget-case", budget: 100 },
        defaultPolicy,
      ],
      [
        "no allowed merchant",
        { ...profiles[0], id: "merchant-case" },
        { ...defaultPolicy, allowedMerchants: [] },
      ],
    ] as const) {
      const response = await post({ action: "run", profile, policy });
      assert.equal(response.status(), 200, await response.text());
      const result = await response.json();
      assert.equal(result.result.receipt, undefined);
      assert.equal(result.wallet.balance, 17600);
      console.log(`PASS ${name}: no purchase and balance unchanged`);
    }
  } finally {
    await client.dispose();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
