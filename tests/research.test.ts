import assert from "node:assert/strict";
import test from "node:test";
import axios, { type AxiosAdapter } from "axios";
import { profiles } from "../src/lib/data";
import {
  publicUrl,
  researchGifts,
  researchMode,
  researchQueries,
} from "../src/lib/research";

function restoreEnv(name: string, previous: string | undefined) {
  if (previous === undefined) delete process.env[name];
  else process.env[name] = previous;
}

test("research mode defaults to catalog locally and web only for Vercel production", () => {
  const previousMode = process.env.GIFT_RESEARCH_MODE;
  const previousVercel = process.env.VERCEL_ENV;
  try {
    delete process.env.GIFT_RESEARCH_MODE;
    delete process.env.VERCEL_ENV;
    assert.equal(researchMode(), "catalog");
    process.env.VERCEL_ENV = "preview";
    assert.equal(researchMode(), "catalog");
    process.env.VERCEL_ENV = "production";
    assert.equal(researchMode(), "web");
    process.env.GIFT_RESEARCH_MODE = "catalog";
    assert.equal(researchMode(), "catalog");
    delete process.env.VERCEL_ENV;
    process.env.GIFT_RESEARCH_MODE = "web";
    assert.equal(researchMode(), "web");
  } finally {
    restoreEnv("GIFT_RESEARCH_MODE", previousMode);
    restoreEnv("VERCEL_ENV", previousVercel);
  }
});

test("local catalog mode makes zero Tavily requests even with an API key present", async () => {
  const previousMode = process.env.GIFT_RESEARCH_MODE;
  const previousVercel = process.env.VERCEL_ENV;
  const previousKey = process.env.TAVILY_API_KEY;
  const previousAdapter = axios.defaults.adapter;
  let requests = 0;
  delete process.env.GIFT_RESEARCH_MODE;
  delete process.env.VERCEL_ENV;
  process.env.TAVILY_API_KEY = "test-only-key";
  axios.defaults.adapter = async () => {
    requests++;
    throw new Error("Network must not be called");
  };
  try {
    const result = await researchGifts(profiles[0], [
      { name: "Coffee", evidence: "Enjoys coffee", inferred: false },
    ]);
    assert.equal(result.status, "catalog");
    assert.deepEqual(result.queries, []);
    assert.deepEqual(result.sources, []);
    assert.deepEqual(result.insights, []);
    assert.deepEqual(result.gifts, []);
    assert.equal(requests, 0);
  } finally {
    axios.defaults.adapter = previousAdapter;
    restoreEnv("GIFT_RESEARCH_MODE", previousMode);
    restoreEnv("VERCEL_ENV", previousVercel);
    restoreEnv("TAVILY_API_KEY", previousKey);
  }
});

test("research queries use interests and budget without recipient identity or contact details", () => {
  const queries = researchQueries(profiles[0], [
    {
      name: "Alex, Morgan coffee alex@example.com https://private.example.com 07700 900123",
      evidence: "Private notes should never be sent verbatim",
      inferred: false,
    },
  ]);
  assert.deepEqual(
    queries.map((q) => q.kind),
    ["trend", "product"],
  );
  for (const { query } of queries) {
    assert.match(query, /coffee/);
    assert.doesNotMatch(query, /alex|morgan|example|07700|private notes/i);
  }
  assert.match(queries[1].query, /under £65/);
});

test("empty extracted interests use generic gift queries", () => {
  const queries = researchQueries(profiles[1], []);
  assert.match(queries[0].query, /thoughtful gifts gift trends/);
  assert.match(queries[1].query, /under £120/);
});

test("clickable research links require public HTTP(S) URLs", () => {
  for (const url of [
    "javascript:alert(1)",
    "data:text/html,hello",
    "file:///etc/passwd",
    "https://user:password@example.com",
    "http://localhost/test",
    "http://127.0.0.1",
    "http://10.1.2.3",
    "http://[::1]",
    "http://metadata.internal/path",
    "http://host.local",
    "http://x.localhost",
    "not a url",
  ]) {
    assert.equal(publicUrl(url), undefined, url);
  }
  assert.equal(
    publicUrl("https://shop.example.com/gifts?q=coffee#details"),
    "https://shop.example.com/gifts?q=coffee",
  );
});

test("missing Tavily key produces an honest unavailable result", async () => {
  const previous = process.env.TAVILY_API_KEY;
  const previousMode = process.env.GIFT_RESEARCH_MODE;
  process.env.GIFT_RESEARCH_MODE = "web";
  delete process.env.TAVILY_API_KEY;
  try {
    const result = await researchGifts(profiles[0], []);
    assert.equal(result.status, "unavailable");
    assert.deepEqual(result.queries, []);
    assert.deepEqual(result.sources, []);
    assert.deepEqual(result.insights, []);
    assert.deepEqual(result.gifts, []);
    assert.ok(Number.isFinite(Date.parse(result.searchedAt)));
  } finally {
    restoreEnv("GIFT_RESEARCH_MODE", previousMode);
    if (previous === undefined) delete process.env.TAVILY_API_KEY;
    else process.env.TAVILY_API_KEY = previous;
  }
});

async function withTavilyMock(adapter: AxiosAdapter, run: () => Promise<void>) {
  const previousKey = process.env.TAVILY_API_KEY;
  const previousMode = process.env.GIFT_RESEARCH_MODE;
  const previousAdapter = axios.defaults.adapter;
  process.env.TAVILY_API_KEY = "test-only-key";
  process.env.GIFT_RESEARCH_MODE = "web";
  axios.defaults.adapter = adapter;
  try {
    await run();
  } finally {
    restoreEnv("GIFT_RESEARCH_MODE", previousMode);
    axios.defaults.adapter = previousAdapter;
    if (previousKey === undefined) delete process.env.TAVILY_API_KEY;
    else process.env.TAVILY_API_KEY = previousKey;
  }
}

test("Tavily requests return cited, bounded, deduplicated safe sources", async () => {
  const requests: Record<string, unknown>[] = [];
  await withTavilyMock(
    async (config) => {
      const body = JSON.parse(config.data);
      requests.push(body);
      const kind = body.time_range ? "trend" : "product";
      return {
        status: 200,
        statusText: "OK",
        headers: {},
        config,
        data: {
          images: [],
          response_time: 0.1,
          results: [
            {
              title: "A".repeat(220),
              url: `https://${kind}.example.com/gifts#section`,
              content: "Evidence ".repeat(200),
              score: 0.8,
            },
            {
              title: "Duplicate",
              url: `https://${kind}.example.com/gifts#other`,
              content: "Duplicate",
              score: 0.7,
            },
            {
              title: "Shared source",
              url: "https://shared.example.com/gifts",
              content: "Relevant to trends and product discovery",
              score: 0.8,
            },
            {
              title: "Unsafe",
              url: "http://127.0.0.1/private",
              content: "Reject",
              score: 0.9,
            },
          ],
        },
      };
    },
    async () => {
      const result = await researchGifts(profiles[0], [
        { name: "Coffee", evidence: "Loves specialty coffee", inferred: false },
      ]);
      assert.equal(result.status, "complete");
      assert.equal(requests.length, 2);
      assert.ok(
        requests.every(
          (q) =>
            q.max_results === 4 &&
            q.include_raw_content === false &&
            q.include_answer === false,
        ),
      );
      assert.deepEqual(
        result.queries.map((q) => q.status),
        ["ok", "ok"],
      );
      assert.deepEqual(
        result.sources.map((s) => s.id),
        ["S1", "S2", "S3", "S4"],
      );
      assert.deepEqual(
        result.sources.map((s) => s.kind),
        ["trend", "trend", "product", "product"],
      );
      assert.equal(
        result.sources.filter(
          (s) => s.url === "https://shared.example.com/gifts",
        ).length,
        2,
        "a URL returned for both searches remains available for both citation kinds",
      );
      assert.ok(
        result.sources.every(
          (s) => s.title.length <= 200 && s.snippet.length <= 1400,
        ),
      );
      assert.ok(result.sources.every((s) => !s.url.includes("#")));
    },
  );
});

test("one failed search preserves usable research and reports partial status", async () => {
  await withTavilyMock(
    async (config) => {
      const body = JSON.parse(config.data);
      if (body.time_range) throw new Error("Simulated timeout");
      return {
        status: 200,
        statusText: "OK",
        headers: {},
        config,
        data: {
          images: [],
          results: [
            {
              title: "Coffee set",
              url: "https://shop.example.com/coffee",
              content: "Coffee discovery gift",
              score: 0.8,
            },
          ],
        },
      };
    },
    async () => {
      const result = await researchGifts(profiles[0], []);
      assert.equal(result.status, "partial");
      assert.deepEqual(
        result.queries.map((q) => q.status),
        ["failed", "ok"],
      );
      assert.equal(result.sources.length, 1);
      assert.equal(result.sources[0].kind, "product");
    },
  );
});

test("all failed searches have no fabricated sources or insights", async () => {
  await withTavilyMock(
    async () => {
      throw new Error("Simulated provider failure");
    },
    async () => {
      const result = await researchGifts(profiles[0], []);
      assert.equal(result.status, "unavailable");
      assert.deepEqual(
        result.queries.map((q) => q.status),
        ["failed", "failed"],
      );
      assert.deepEqual(result.sources, []);
      assert.deepEqual(result.insights, []);
      assert.deepEqual(result.gifts, []);
    },
  );
});
