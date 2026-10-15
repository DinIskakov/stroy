import { tavily } from "@tavily/core";
import type { Profile } from "./data";

export type ResearchSource = {
  id: string;
  title: string;
  url: string;
  snippet: string;
  kind: "trend" | "product";
  publishedAt?: string;
};
export type Research = {
  status: "complete" | "partial" | "unavailable";
  searchedAt: string;
  queries: {
    kind: "trend" | "product";
    query: string;
    status: "ok" | "failed";
  }[];
  sources: ResearchSource[];
  insights: { text: string; sourceIds: string[] }[];
  gifts: { name: string; reason: string; sourceId: string }[];
};
export type Interest = { name: string; evidence: string; inferred: boolean };

// Only public HTTP(S) links can leave the research tool or become clickable in the UI.
export function publicUrl(raw: string): string | undefined {
  try {
    const url = new URL(raw);
    const host = url.hostname.toLowerCase();
    if (
      !["https:", "http:"].includes(url.protocol) ||
      url.username ||
      url.password ||
      !host.includes(".") ||
      host.endsWith(".local") ||
      host.endsWith(".internal") ||
      host.endsWith(".localhost") ||
      /^\d+(\.\d+){3}$/.test(host) ||
      host.includes(":")
    )
      return;
    url.hash = "";
    return url.toString();
  } catch {
    return;
  }
}

export function researchQueries(profile: Profile, interests: Interest[]) {
  // Do not search for a person's identity or send their free-text notes to Tavily.
  const names = profile.name
    .toLowerCase()
    .split(/\s+/)
    .filter((x) => x.length > 1);
  const terms = interests
    .slice(0, 3)
    .map((i) =>
      i.name
        .replace(/https?:\/\/\S+|\S+@\S+|\b\d[\d\s+()-]{5,}\b/g, "")
        .replace(/[^\p{L}\p{N}\s&-]/gu, " ")
        .split(/\s+/)
        .filter((word) => !names.includes(word.toLowerCase()))
        .join(" ")
        .replace(/[^\p{L}\p{N}\s&-]/gu, "")
        .trim()
        .slice(0, 55),
    )
    .filter(Boolean);
  const topic = terms.join(" ") || "thoughtful gifts";
  return [
    {
      kind: "trend" as const,
      query: `${topic} gift trends ${new Date().getFullYear()} UK`.slice(
        0,
        300,
      ),
    },
    {
      kind: "product" as const,
      query:
        `${topic} gift buy UK under £${Math.floor(profile.budget / 100)}`.slice(
          0,
          300,
        ),
    },
  ];
}

export async function researchGifts(
  profile: Profile,
  interests: Interest[],
): Promise<Research> {
  const research: Research = {
    status: "unavailable",
    searchedAt: new Date().toISOString(),
    queries: [],
    sources: [],
    insights: [],
    gifts: [],
  };
  if (!process.env.TAVILY_API_KEY) return research;
  const client = tavily({ apiKey: process.env.TAVILY_API_KEY });
  const queries = researchQueries(profile, interests);
  const results = await Promise.allSettled(
    queries.map((q) =>
      client.search(q.query, {
        searchDepth: "basic",
        maxResults: 4,
        includeAnswer: false,
        includeRawContent: false,
        ...(q.kind === "trend" ? { timeRange: "year" as const } : {}),
        timeout: 15,
      }),
    ),
  );
  results.forEach((response, index) => {
    const q = queries[index];
    research.queries.push({
      ...q,
      status: response.status === "fulfilled" ? "ok" : "failed",
    });
    if (response.status !== "fulfilled") return;
    for (const source of response.value.results) {
      const url = publicUrl(source.url);
      if (!url || research.sources.some((s) => s.url === url && s.kind === q.kind)) continue;
      research.sources.push({
        id: `S${research.sources.length + 1}`,
        title: source.title.slice(0, 200),
        url,
        snippet: source.content.slice(0, 1400),
        kind: q.kind,
        ...(source.publishedDate ? { publishedAt: source.publishedDate } : {}),
      });
    }
  });
  const successes = research.queries.filter((q) => q.status === "ok").length;
  research.status = research.sources.length
    ? successes === 2
      ? "complete"
      : "partial"
    : "unavailable";
  return research;
}
