import assert from "node:assert/strict";
import { test } from "node:test";
import { personDataset, rememberPerson, recallPerson } from "../src/lib/cognee";
import { profiles } from "../src/lib/data";
import { profileSchema, prepareProfile } from "../src/lib/profile-schema";

test("Cognee memory isolates people, uploads details, scopes retrieval and handles failures", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.COGNEE_API_KEY;
  process.env.COGNEE_API_KEY = "test-secret";
  const dataset = personDataset("browser-one", "sophie");
  assert.notEqual(dataset, personDataset("browser-two", "sophie"));
  assert.notEqual(dataset, personDataset("browser-one", "alex"));
  const person = {
    ...profiles[1],
    address: "10 Example Lane",
    birthday: "1998-06-12",
  };
  assert.equal(profileSchema.safeParse(person).success, true);
  assert.equal(prepareProfile({ ...person, name: " " }), null);
  assert.equal(prepareProfile({ ...person, notes: "" }), null);
  assert.equal(prepareProfile({ ...person, birthday: "2026-02-30" }), null);
  assert.deepEqual(
    prepareProfile({ ...person, interests: [" pottery ", ""] })?.interests,
    ["pottery"],
  );
  assert.equal(
    prepareProfile({ ...person, name: " Sophie  Chen " })?.initials,
    "SC",
  );
  assert.equal(
    profileSchema.safeParse({ ...person, address: "x".repeat(501) }).success,
    false,
  );
  const calls: string[] = [];
  globalThis.fetch = async (url, options) => {
    calls.push(String(url));
    assert.equal(
      (options?.headers as Record<string, string>)["X-Api-Key"],
      "test-secret",
    );
    if (String(url).endsWith("/add")) {
      const form = options?.body as FormData;
      assert.equal(form.get("datasetName"), dataset);
      const snapshot = JSON.parse(await (form.get("data") as Blob).text());
      assert.equal(snapshot.address, person.address);
      assert.equal(snapshot.birthday, person.birthday);
      assert.equal(snapshot.date, person.date);
    } else {
      const body = JSON.parse(options?.body as string);
      assert.deepEqual(body.datasets, [dataset]);
      if (String(url).endsWith("/cognify"))
        assert.equal(body.run_in_background, true);
    }
    return Response.json({ result: "Sophie enjoys pottery." });
  };
  try {
    assert.match(
      (await rememberPerson(dataset, person)).message,
      /indexing is queued/,
    );
    assert.deepEqual(await recallPerson(dataset, person.name), {
      result: "Sophie enjoys pottery.",
    });
    assert.equal(calls.length, 3);
    globalThis.fetch = async () =>
      new Response("secret upstream body", { status: 401 });
    await assert.rejects(
      recallPerson(dataset, person.name),
      /rejected the API key/,
    );
    await assert.rejects(
      rememberPerson(dataset, person),
      /rejected the API key/,
    );
    globalThis.fetch = async () => {
      throw new Error("private transport detail");
    };
    await assert.rejects(
      recallPerson(dataset, person.name),
      /Could not reach Cognee/,
    );
    globalThis.fetch = async (url) =>
      String(url).endsWith("/add")
        ? Response.json({})
        : new Response("error", { status: 500 });
    assert.match(
      (await rememberPerson(dataset, person)).message,
      /indexing could not start/,
    );
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.COGNEE_API_KEY;
    else process.env.COGNEE_API_KEY = originalKey;
  }
});
