import assert from "node:assert/strict";
import test from "node:test";
import {
  catalog,
  defaultPolicy,
  profiles,
  type Receipt,
  type Wallet,
} from "../src/lib/data";
import {
  executePayment,
  paymentProvider,
  sandboxClient,
} from "../src/lib/payments";

const coffee = catalog.find((p) => p.id === "coffee")!;
const destination = "acct_TestMerchant123";
const wallet = (): Wallet => ({ balance: 30000, receipts: [], runs: 0 });
const receipt = (overrides: Partial<Receipt> = {}): Receipt => ({
  id: "payment-unit-test",
  profileId: profiles[0].id,
  name: profiles[0].name,
  productId: coffee.id,
  total: coffee.price + coffee.shipping,
  budget: profiles[0].budget,
  date: "2099-11-08",
  reason: "Matches the recipient's stated coffee interest",
  evidence: "Loves specialty coffee",
  rules: ["P2 · Approved merchant", "P8 · Within automatic spending limit"],
  at: new Date().toISOString(),
  status: "processing",
  policy: defaultPolicy,
  ...overrides,
});
type CapturedRequest = {
  url: URL;
  init: RequestInit;
  headers: Headers;
  body: URLSearchParams;
};
function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      "stripe-should-retry": "false",
    },
  });
}
function balance(amount: number) {
  return response({
    object: "balance",
    livemode: false,
    available: [{ currency: "gbp", amount }],
    pending: [],
  });
}
function transfer(total = 3600) {
  return response({
    id: "tr_TestGift123",
    object: "transfer",
    livemode: false,
    amount: total,
    currency: "gbp",
    destination,
    reversed: false,
  });
}
async function sandbox(
  run: (requests: CapturedRequest[]) => Promise<void>,
  handler?: (
    request: CapturedRequest,
    index: number,
  ) => Response | Promise<Response>,
  environment: Record<string, string | undefined> = {},
) {
  const values: Record<string, string | undefined> = {
    PAYMENT_PROVIDER: "stripe",
    STRIPE_PAYMENT_FLOW: "transfer",
    STRIPE_SECRET_KEY: "sk_test_unit_test_only",
    STRIPE_MERCHANT_ACCOUNTS: JSON.stringify({
      [coffee.merchant]: destination,
    }),
    ...environment,
  };
  const previous = Object.fromEntries(
    Object.keys(values).map((key) => [key, process.env[key]]),
  );
  const originalFetch = globalThis.fetch;
  const requests: CapturedRequest[] = [];
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  globalThis.fetch = (async (
    input: string | URL | Request,
    init?: RequestInit,
  ) => {
    const request = {
      url: new URL(input instanceof Request ? input.url : String(input)),
      init: init || {},
      headers: new Headers(init?.headers),
      body: new URLSearchParams(String(init?.body || "")),
    };
    requests.push(request);
    if (!handler) throw new Error("Unexpected Stripe request in test");
    return handler(request, requests.length - 1);
  }) as typeof fetch;
  try {
    await run(requests);
  } finally {
    globalThis.fetch = originalFetch;
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

test("live Stripe keys are refused without a request or wallet debit", async () => {
  await sandbox(
    async (requests) => {
      assert.throws(() => sandboxClient(), /Live keys are not accepted/);
      const state = wallet();
      const result = await executePayment(receipt(), state);
      assert.equal(result.status, "failed");
      assert.match(result.payment?.error || "", /Live keys are not accepted/);
      assert.equal(state.balance, 30000);
      assert.equal(requests.length, 0);
    },
    undefined,
    { STRIPE_SECRET_KEY: "sk_live_unit_test_only" },
  );
});

test("missing approved merchant mapping fails without debiting funds", async () => {
  await sandbox(
    async (requests) => {
      const state = wallet();
      const result = await executePayment(receipt(), state);
      assert.equal(result.status, "failed");
      assert.match(result.payment?.error || "", /connected account/);
      assert.equal(state.balance, 30000);
      assert.equal(requests.length, 0);
    },
    undefined,
    { STRIPE_MERCHANT_ACCOUNTS: "{}" },
  );
});

test("unknown products, altered totals and insufficient wallet funds cannot reach Stripe", async () => {
  await sandbox(async (requests) => {
    for (const attempted of [
      receipt({ productId: "attacker-product" }),
      receipt({ total: 1 }),
      receipt({ total: 0 }),
    ]) {
      const state = wallet();
      await assert.rejects(
        executePayment(attempted, state),
        /Payment amount does not match/,
      );
      assert.equal(state.balance, 30000);
    }
    const state = { ...wallet(), balance: 3500 };
    await assert.rejects(
      executePayment(receipt(), state),
      /Payment amount does not match/,
    );
    assert.equal(state.balance, 3500);
    assert.equal(requests.length, 0);
  });
});

test("pending or declined gifts require explicit approval before payment", async () => {
  await sandbox(async (requests) => {
    const state = wallet();
    for (const status of ["pending", "declined"] as const) {
      await assert.rejects(
        executePayment(receipt({ status }), state),
        /explicit approval/,
      );
    }
    assert.equal(state.balance, 30000);
    assert.equal(requests.length, 0);
  });
});

test("sandbox transfer uses canonical amount, currency, merchant and stable idempotency key", async () => {
  await sandbox(
    async (requests) => {
      const state = wallet();
      const result = await executePayment(receipt(), state);
      assert.equal(result.status, "paid");
      assert.equal(state.balance, 26400);
      assert.equal(state.receipts.length, 1);
      assert.deepEqual(result.payment, {
        provider: "stripe",
        type: "transfer",
        id: "tr_TestGift123",
        status: "succeeded",
        destination,
        balanceBefore: 50000,
        balanceAfter: 46400,
      });
      assert.deepEqual(
        requests.map((r) => `${r.init.method} ${r.url.pathname}`),
        ["GET /v1/balance", "POST /v1/transfers", "GET /v1/balance"],
      );
      assert.ok(
        requests.every((r) => r.url.origin === "https://api.stripe.com"),
      );
      const payment = requests[1];
      assert.equal(payment.body.get("amount"), "3600");
      assert.equal(payment.body.get("currency"), "gbp");
      assert.equal(payment.body.get("destination"), destination);
      assert.equal(
        payment.headers.get("idempotency-key"),
        "stroy-gift-payment-unit-test",
      );
      assert.equal(
        payment.body.get("metadata[stroy_decision_id]"),
        "payment-unit-test",
      );
      assert.equal(payment.body.get("metadata[product_id]"), coffee.id);
      assert.equal(payment.body.get("metadata[merchant]"), coffee.merchant);
      assert.equal(
        payment.body.get("metadata[budget_pence]"),
        String(profiles[0].budget),
      );
      assert.equal(
        payment.body.get("metadata[auto_limit_pence]"),
        String(defaultPolicy.autoLimit),
      );
      assert.equal(payment.body.get("metadata[policy_rules]"), "P2,P8");
      assert.equal(payment.body.get("metadata[sandbox]"), "true");
      const retried = await executePayment(receipt(), state);
      assert.equal(retried, result);
      assert.equal(state.balance, 26400);
      assert.equal(
        requests.length,
        3,
        "replaying a paid decision does not issue another transfer",
      );
    },
    (request, index) =>
      request.url.pathname === "/v1/transfers"
        ? transfer()
        : balance(index === 0 ? 50000 : 46400),
  );
});

test("insufficient Stripe GBP balance prevents a transfer and leaves wallet intact", async () => {
  await sandbox(
    async (requests) => {
      const state = wallet();
      const result = await executePayment(receipt(), state);
      assert.equal(result.status, "failed");
      assert.match(result.payment?.error || "", /Insufficient GBP/);
      assert.equal(state.balance, 30000);
      assert.equal(requests.length, 1);
      assert.equal(requests[0].url.pathname, "/v1/balance");
    },
    () => balance(3500),
  );
});

test("rejected Stripe transfer never marks a gift paid or debits wallet funds", async () => {
  await sandbox(
    async () => {
      const state = wallet();
      const result = await executePayment(receipt(), state);
      assert.equal(result.status, "failed");
      assert.equal(result.payment?.status, "failed");
      assert.equal(state.balance, 30000);
      assert.equal(state.receipts[0].status, "failed");
    },
    (request) =>
      request.url.pathname === "/v1/balance"
        ? balance(50000)
        : response(
            {
              error: {
                type: "invalid_request_error",
                message: "Destination does not exist",
                code: "resource_missing",
              },
            },
            400,
          ),
  );
});

test("an inactive Stripe merchant explains verification and preserves funds", async () => {
  await sandbox(
    async () => {
      const state = wallet();
      const result = await executePayment(receipt(), state);
      assert.equal(result.status, "failed");
      assert.match(result.payment?.error || "", /verification/);
      assert.equal(state.balance, 30000);
      assert.equal(state.receipts[0].status, "failed");
    },
    (request) =>
      request.url.pathname === "/v1/balance"
        ? balance(50000)
        : response(
            {
              error: {
                type: "invalid_request_error",
                code: "insufficient_capabilities_for_transfer",
                message: "Transfers are inactive",
              },
            },
            400,
          ),
  );
});

test("ambiguous confirmation retries the same idempotency key and debits once when confirmed", async () => {
  let transferCalls = 0;
  await sandbox(
    async (requests) => {
      const state = wallet();
      const uncertain = await executePayment(receipt(), state);
      assert.equal(uncertain.status, "processing");
      assert.equal(uncertain.payment?.status, "processing");
      assert.equal(state.balance, 30000);
      const confirmed = await executePayment(uncertain, state);
      assert.equal(confirmed.status, "paid");
      assert.equal(confirmed.payment?.balanceBefore, 50000);
      assert.equal(confirmed.payment?.balanceAfter, 46400);
      assert.equal(state.balance, 26400);
      assert.equal(state.receipts.length, 1);
      const transfers = requests.filter(
        (r) => r.url.pathname === "/v1/transfers",
      );
      assert.equal(transfers.length, 2);
      assert.ok(
        transfers.every(
          (r) =>
            r.headers.get("idempotency-key") === "stroy-gift-payment-unit-test",
        ),
      );
      assert.equal(
        requests.filter((r) => r.url.pathname === "/v1/balance").length,
        2,
        "retry reuses original balance check and only refreshes balance after confirmation",
      );
      await executePayment(uncertain, state);
      assert.equal(state.balance, 26400);
      assert.equal(transferCalls, 2);
    },
    (request) => {
      if (request.url.pathname === "/v1/balance")
        return balance(transferCalls ? 46400 : 50000);
      transferCalls++;
      return transferCalls === 1
        ? response(
            {
              error: { type: "api_error", message: "Confirmation unavailable" },
            },
            500,
          )
        : transfer();
    },
  );
});

test("unexpected transfer confirmation details never mark the gift paid", async () => {
  await sandbox(
    async () => {
      const state = wallet();
      const result = await executePayment(receipt(), state);
      assert.equal(result.status, "failed");
      assert.equal(state.balance, 30000);
    },
    (request) =>
      request.url.pathname === "/v1/balance" ? balance(50000) : transfer(1),
  );
});

test("explicit mock mode performs no Stripe request even when a test key exists", async () => {
  await sandbox(
    async (requests) => {
      assert.equal(paymentProvider(), "mock");
      const state = wallet();
      const result = await executePayment(receipt(), state);
      assert.equal(result.status, "paid");
      assert.deepEqual(result.payment, {
        provider: "mock",
        status: "succeeded",
        balanceBefore: 30000,
        balanceAfter: 26400,
      });
      assert.equal(state.balance, 26400);
      await executePayment(receipt(), state);
      assert.equal(state.balance, 26400);
      assert.equal(requests.length, 0);
    },
    undefined,
    { PAYMENT_PROVIDER: "mock" },
  );
});

const payoutWallet = (): Wallet => ({ balance: 34600, receipts: [], runs: 0 });
const payoutDestination = "ba_TestBank123";
const payoutEnvironment = {
  STRIPE_PAYMENT_FLOW: "payout",
  STRIPE_PAYOUT_DESTINATION: payoutDestination,
  STRIPE_MERCHANT_ACCOUNTS: "{}",
};
function payoutResponse(overrides: Record<string, unknown> = {}) {
  return response({
    id: "po_TestGift123",
    object: "payout",
    type: "bank_account",
    balance_transaction: "txn_TestDebit123",
    status: "paid",
    livemode: false,
    amount: 3600,
    currency: "gbp",
    destination: payoutDestination,
    metadata: { stroy_decision_id: "payment-unit-test" },
    ...overrides,
  });
}
function payoutHandler(
  options: {
    result?: Record<string, unknown>;
    failFirst?: boolean;
    decline?: boolean;
    funds?: number;
  } = {},
) {
  let submitted = false;
  let postCount = 0;
  return (request: CapturedRequest) => {
    if (request.url.pathname === "/v1/balance")
      return balance(options.funds ?? (submitted ? 46400 : 50000));
    assert.ok(
      request.url.pathname.startsWith("/v1/payouts"),
      "payout mode never calls Connect or PaymentIntents",
    );
    if (request.init.method === "POST") {
      submitted = true;
      postCount++;
      if (options.decline)
        return response(
          {
            error: {
              type: "invalid_request_error",
              code: "balance_insufficient",
              message: "Payout failed",
            },
          },
          400,
        );
      if (options.failFirst && postCount === 1)
        return response(
          { error: { type: "api_error", message: "Confirmation delayed" } },
          500,
        );
    }
    return payoutResponse(options.result);
  };
}

test("sandbox payout sends canonical funds out and debits allowance only once", async () => {
  await sandbox(
    async (requests) => {
      const state = payoutWallet();
      const result = await executePayment(receipt(), state);
      assert.equal(result.status, "paid");
      assert.equal(result.payment?.provider, "stripe");
      assert.equal(result.payment?.type, "payout");
      assert.equal(result.payment?.id, "po_TestGift123");
      assert.equal(result.payment?.status, "succeeded");
      assert.equal(result.payment?.allowanceBefore, 34600);
      assert.equal(result.payment?.allowanceAfter, 31000);
      assert.equal(result.payment?.balanceBefore, 50000);
      assert.equal(result.payment?.balanceAfter, 46400);
      assert.equal(result.payment?.destination, payoutDestination);
      assert.equal(state.balance, 31000);
      const post = requests.find((r) => r.init.method === "POST")!;
      assert.equal(post.url.href, "https://api.stripe.com/v1/payouts");
      assert.equal(post.body.get("amount"), "3600");
      assert.equal(post.body.get("currency"), "gbp");
      assert.equal(post.body.get("destination"), payoutDestination);
      assert.equal(
        post.body.get("metadata[stroy_decision_id]"),
        "payment-unit-test",
      );
      assert.equal(
        post.headers.get("idempotency-key"),
        "stroy-payout-gift-payment-unit-test",
      );
      assert.equal(
        requests.filter(
          (r) => r.url.pathname === "/v1/payouts" && r.init.method === "POST",
        ).length,
        1,
      );
      assert.ok(
        requests.some(
          (r) =>
            r.url.pathname === "/v1/payouts/po_TestGift123" &&
            r.init.method === "GET",
        ),
      );
      const requestCount = requests.length;
      const repeated = await executePayment(receipt(), state);
      assert.equal(repeated, result);
      assert.equal(state.balance, 31000);
      assert.equal(requests.length, requestCount);
    },
    payoutHandler(),
    payoutEnvironment,
  );
});

test("sandbox payout rejects an invalid server configured bank destination", async () => {
  await sandbox(
    async (requests) => {
      const state = payoutWallet();
      const result = await executePayment(receipt(), state);
      assert.equal(result.status, "failed");
      assert.equal(state.balance, 34600);
      assert.equal(requests.length, 0);
    },
    undefined,
    {
      ...payoutEnvironment,
      STRIPE_PAYOUT_DESTINATION: "untrusted-destination",
    },
  );
});

test("rejected sandbox payout never marks paid or deducts allowance", async () => {
  await sandbox(
    async () => {
      const state = payoutWallet();
      const result = await executePayment(receipt(), state);
      assert.equal(result.status, "failed");
      assert.equal(result.payment?.status, "failed");
      assert.equal(state.balance, 34600);
    },
    payoutHandler({ decline: true }),
    payoutEnvironment,
  );
});

test("sandbox payout success must match amount, currency, destination, decision and test mode", async () => {
  for (const mismatch of [
    { amount: 1 },
    { currency: "usd" },
    { destination: "ba_UnapprovedBank" },
    { livemode: true },
    { metadata: { stroy_decision_id: "another-decision" } },
  ]) {
    await sandbox(
      async () => {
        const state = payoutWallet();
        const result = await executePayment(receipt(), state);
        assert.notEqual(result.status, "paid", JSON.stringify(mismatch));
        assert.equal(state.balance, 34600);
      },
      payoutHandler({ result: mismatch }),
      payoutEnvironment,
    );
  }
});

test("pending and in-transit payouts reserve spending allowance as funds leave Stripe", async () => {
  for (const status of ["pending", "in_transit"]) {
    await sandbox(
      async () => {
        const state = payoutWallet();
        const result = await executePayment(receipt(), state);
        assert.equal(result.status, "processing");
        assert.equal(result.payment?.status, "processing");
        assert.equal(result.payment?.allowanceDebited, true);
        assert.equal(state.balance, 31000);
        await executePayment(receipt(), state);
        assert.equal(
          state.balance,
          31000,
          "replaying the original decision does not reserve allowance twice",
        );
      },
      payoutHandler({ result: { status } }),
      payoutEnvironment,
    );
  }
});

test("failed and canceled payouts leave spending allowance intact", async () => {
  for (const status of ["failed", "canceled"]) {
    await sandbox(
      async () => {
        const state = payoutWallet();
        const result = await executePayment(receipt(), state);
        assert.equal(result.status, "failed");
        assert.equal(state.balance, 34600);
      },
      payoutHandler({ result: { status } }),
      payoutEnvironment,
    );
  }
});

test("ambiguous payout failure retries with its stable key and debits once on confirmation", async () => {
  await sandbox(
    async (requests) => {
      const state = payoutWallet();
      const uncertain = await executePayment(receipt(), state);
      assert.equal(uncertain.status, "processing");
      assert.equal(state.balance, 34600);
      const confirmed = await executePayment(uncertain, state);
      assert.equal(confirmed.status, "paid");
      assert.equal(state.balance, 31000);
      const posts = requests.filter((r) => r.init.method === "POST");
      assert.equal(posts.length, 2);
      assert.ok(
        posts.every(
          (r) =>
            r.headers.get("idempotency-key") ===
            "stroy-payout-gift-payment-unit-test",
        ),
      );
      const requestCount = requests.length;
      await executePayment(uncertain, state);
      assert.equal(requests.length, requestCount);
      assert.equal(state.balance, 31000);
      assert.equal(state.receipts.length, 1);
    },
    payoutHandler({ failFirst: true }),
    payoutEnvironment,
  );
});

test("a known pending payout keeps its provider and flow when environment settings change", async () => {
  let confirmed = false;
  const handler = payoutHandler();
  await sandbox(
    async (requests) => {
      const state = payoutWallet();
      const uncertain = await executePayment(receipt(), state);
      assert.equal(uncertain.status, "processing");
      assert.equal(uncertain.payment?.id, "po_TestGift123");
      assert.equal(state.balance, 31000);
      process.env.PAYMENT_PROVIDER = "mock";
      process.env.STRIPE_PAYMENT_FLOW = "transfer";
      confirmed = true;
      const paid = await executePayment(uncertain, state);
      assert.equal(paid.status, "paid");
      assert.equal(paid.payment?.provider, "stripe");
      assert.equal(paid.payment?.type, "payout");
      assert.equal(state.balance, 31000);
      assert.equal(
        requests.filter((r) => r.init.method === "POST").length,
        1,
        "known payout is retrieved on retry, never paid a second time",
      );
    },
    (request) => {
      const result = handler(request);
      return request.url.pathname.startsWith("/v1/payouts") && !confirmed
        ? payoutResponse({ status: "pending" })
        : result;
    },
    payoutEnvironment,
  );
});

test("a failed or canceled payout releases its allowance reservation exactly once", async () => {
  for (const terminalStatus of ["failed", "canceled"]) {
    let status = "pending";
    const handler = payoutHandler();
    await sandbox(
      async () => {
        const state = payoutWallet();
        const pending = await executePayment(receipt(), state);
        assert.equal(pending.status, "processing");
        assert.equal(state.balance, 31000);
        status = terminalStatus;
        const failed = await executePayment(pending, state);
        assert.equal(failed.status, "failed");
        assert.equal(state.balance, 34600);
        await executePayment(failed, state);
        assert.equal(state.balance, 34600);
        await executePayment(pending, state);
        assert.equal(
          state.balance,
          34600,
          "a stale pending receipt cannot release the same reservation twice",
        );
      },
      (request) => {
        const result = handler(request);
        return request.url.pathname.startsWith("/v1/payouts")
          ? payoutResponse({ status })
          : result;
      },
      payoutEnvironment,
    );
  }
});

test("payout mode may use the platform's default sandbox GBP bank", async () => {
  await sandbox(
    async (requests) => {
      const state = payoutWallet();
      const result = await executePayment(receipt(), state);
      assert.equal(result.status, "paid");
      assert.equal(state.balance, 31000);
      assert.equal(
        requests.find((r) => r.init.method === "POST")?.body.has("destination"),
        false,
      );
    },
    payoutHandler(),
    { ...payoutEnvironment, STRIPE_PAYOUT_DESTINATION: undefined },
  );
});
