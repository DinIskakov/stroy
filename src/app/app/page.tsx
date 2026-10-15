"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  Plus,
  Gift,
  Users,
  CalendarDays,
  Wallet as WalletIcon,
  SlidersHorizontal,
  Sparkles,
  Check,
  X,
  ChevronRight,
  ShieldCheck,
  LoaderCircle,
  Pencil,
  CircleHelp,
  CheckCheck,
  History,
  Menu,
  Search,
  Globe,
  CreditCard,
} from "lucide-react";
import {
  profiles as defaults,
  defaultPolicy,
  merchants,
  catalog,
  money,
  type Profile,
  type Policy,
  type Wallet,
  type AgentResult,
  type Receipt,
} from "@/lib/data";
import { prepareProfile } from "@/lib/profile-schema";
type View =
  "overview" | "people" | "occasions" | "activity" | "wallet" | "settings";
type ProgressEvent = {
  title: string;
  detail: string;
  kind: "info" | "success" | "warning";
  stage:
    | "profile"
    | "memory"
    | "research"
    | "shortlist"
    | "policy"
    | "payment"
    | "complete";
};
const stageIcons = {
  profile: Users,
  memory: History,
  research: Search,
  shortlist: Gift,
  policy: ShieldCheck,
  payment: CreditCard,
  complete: Check,
};
const nav = [
  { id: "overview", label: "People", icon: Users },
  { id: "activity", label: "Activity", icon: History },
] as const;
function ProductPhoto({
  id = "coffee",
  className = "",
  illustrative = false,
}: {
  id?: string;
  className?: string;
  illustrative?: boolean;
}) {
  const product = catalog.find((p) => p.id === id) || catalog[0];
  return (
    <div className={`product-photo ${className}`}>
      <Image
        src={product.photo}
        alt={
          illustrative
            ? `Illustrative photograph: ${product.name}`
            : product.name
        }
        fill
        sizes="(max-width: 600px) 45vw, 320px"
      />
    </div>
  );
}
function giftIllustration(name: string, reason: string) {
  const categories: [RegExp, string][] = [
    [/grinder|grinding/i, "grinder"],
    [/pottery|workshop|wheel|ceramic class/i, "pottery"],
    [/mug|cups?|stoneware|ceramic/i, "cups"],
    [/coffee|beans?|roast|tasting|pour.over|espresso/i, "coffee"],
    [/flower|bouquet|floral/i, "flowers"],
    [/candle|scent|fragrance/i, "candle"],
    [/camera|film|lens/i, "camera"],
    [/journal|notebook|book|outdoor|walk|travel/i, "journal"],
  ];
  return (
    categories.find(([pattern]) => pattern.test(name))?.[1] ||
    categories.find(([pattern]) => pattern.test(reason))?.[1] ||
    "cups"
  );
}
function dateLabel(date: string) {
  return new Date(date + "T12:00:00").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}
export default function Home() {
  const [view, setView] = useState<View>("overview");
  const [people, setPeople] = useState<Profile[]>(defaults);
  const [policy, setPolicy] = useState<Policy>(defaultPolicy);
  const [wallet, setWallet] = useState<Wallet>({
    balance: 30000,
    receipts: [],
    runs: 0,
  });
  const [results, setResults] = useState<Record<string, AgentResult>>({});
  const [selected, setSelected] = useState("alex");
  const [busy, setBusy] = useState(false);
  const [progressEvents, setProgressEvents] = useState<ProgressEvent[]>([]);
  const [error, setError] = useState("");
  const [editing, setEditingState] = useState<Profile | null>(null);
  const [showAgent, setShowAgent] = useState(false);
  const [ready, setReady] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [help, setHelp] = useState(false);
  const [savingPerson, setSavingPerson] = useState(false);
  const [memoryStatus, setMemoryStatus] = useState("");
  const syncedPeople = useRef(new Map<string, string>());
  const syncing = useRef(false);
  const [retryAt, setRetryAt] = useState(0);
  function setEditing(profile: Profile | null) {
    setEditingState(profile);
    if (!profile) return;
    const valid = prepareProfile(profile);
    if (!valid) return;
    setPeople((old) =>
      old.some((p) => p.id === valid.id)
        ? old.map((p) => (p.id === valid.id ? valid : p))
        : [...old, valid],
    );
  }
  useEffect(() => {
    if (!ready || savingPerson || syncing.current) return;
    const pending = people
      .map(prepareProfile)
      .filter(
        (p): p is Profile =>
          p !== null && syncedPeople.current.get(p.id) !== JSON.stringify(p),
      );
    if (!pending.length) return;
    const timer = setTimeout(
      async () => {
        if (syncing.current) return;
        syncing.current = true;
        setSavingPerson(true);
        setMemoryStatus("Saving details to Cognee...");
        try {
          // Serialize first saves so they share the same HTTP-only memory cookie.
          for (const profile of pending) {
            const response = await fetch("/api/people", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "save", profile }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);
            syncedPeople.current.set(profile.id, JSON.stringify(profile));
            setMemoryStatus(data.message);
          }
        } catch (error) {
          setMemoryStatus(
            `Saved in this browser. ${error instanceof Error ? error.message : "Cognee sync failed."} Retrying automatically in 15 seconds.`,
          );
          setRetryAt(Date.now() + 15000);
        } finally {
          syncing.current = false;
          setSavingPerson(false);
        }
      },
      Math.max(1200, retryAt - Date.now()),
    );
    return () => clearTimeout(timer);
  }, [people, ready, savingPerson, retryAt]);

  useEffect(() => {
    async function initialize() {
      await Promise.resolve();
      try {
        const saved = localStorage.getItem("stroy-v1");
        if (saved) {
          const s = JSON.parse(saved);
          if (s.people?.length) setPeople(s.people);
          if (s.policy) setPolicy(s.policy);
          if (s.results) setResults(s.results);
        }
      } catch {}
      fetch("/api/wallet")
        .then((r) => r.json())
        .then(setWallet)
        .catch(() => setError("Could not load your wallet. Please refresh."));
      setReady(true);
    }
    void initialize();
  }, []);
  useEffect(() => {
    if (ready) {
      try {
        localStorage.setItem(
          "stroy-v1",
          JSON.stringify({ people, policy, results }),
        );
      } catch {}
    }
  }, [people, policy, results, ready]);
  const activeDialog = help
    ? "help"
    : editing
      ? "profile"
      : showAgent
        ? "agent"
        : null;
  const closeDialog = useEffectEvent(() => {
    if (busy) return;
    if (help) setHelp(false);
    else if (editing) setEditing(null);
    else setShowAgent(false);
  });
  useEffect(() => {
    if (!activeDialog) return;
    const dialogs = document.querySelectorAll<HTMLElement>('[role="dialog"]');
    const dialog = dialogs[dialogs.length - 1];
    if (!dialog) return;
    const previous =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const focusable = () =>
      Array.from(
        dialog.querySelectorAll<HTMLElement>(
          "button, a[href], input, select, textarea, summary, [tabindex]",
        ),
      ).filter(
        (el) =>
          el.tabIndex >= 0 &&
          !el.matches(":disabled") &&
          el.getClientRects().length > 0,
      );
    dialog.tabIndex = -1;
    (focusable()[0] || dialog).focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeDialog();
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusable();
      const first = items[0];
      const last = items[items.length - 1];
      if (!first) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      if (
        event.shiftKey &&
        (document.activeElement === first ||
          !items.includes(document.activeElement as HTMLElement))
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === last ||
          !items.includes(document.activeElement as HTMLElement))
      ) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previous?.focus();
    };
  }, [activeDialog]);
  const current = people.find((p) => p.id === selected) || people[0];
  const result = results[current?.id];
  const pending = wallet.receipts.filter((r) => r.status === "pending");
  const paid = wallet.receipts.filter((r) => r.status === "paid");
  const stripeEnabled = wallet.paymentProvider === "stripe";
  async function run(profile: Profile) {
    if (busy) return;
    setSelected(profile.id);
    setShowAgent(true);
    setBusy(true);
    setProgressEvents([]);
    setError("");
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/x-ndjson",
        },
        body: JSON.stringify({ action: "run", profile, policy }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Could not start your gift agent.");
      }
      if (!res.headers.get("content-type")?.includes("application/x-ndjson")) {
        const data = await res.json();
        setResults((old) => ({ ...old, [profile.id]: data.result }));
        setWallet(data.wallet);
      } else {
        if (!res.body)
          throw new Error("The agent response was empty. Please try again.");
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let receivedResult = false;
        async function receive(line: string) {
          if (!line.trim()) return;
          const message = JSON.parse(line);
          if (message.type === "error")
            throw new Error(message.error || "The agent could not finish.");
          if (message.type === "progress" && message.event) {
            setProgressEvents((events) => [...events, message.event]);
          } else if (message.type === "result") {
            if (!message.walletToken)
              throw new Error(
                "The agent finished, but its wallet session could not be saved. Please refresh before trying again.",
              );
            const saved = await fetch("/api/wallet", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ token: message.walletToken }),
            });
            if (!saved.ok)
              throw new Error(
                "The agent finished, but your wallet session could not be saved. Please refresh before trying again.",
              );
            receivedResult = true;
            setResults((old) => ({ ...old, [profile.id]: message.result }));
            setWallet(message.wallet);
          }
        }
        try {
          while (true) {
            const { value, done } = await reader.read();
            buffer += decoder.decode(value, { stream: !done });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";
            for (const line of lines) await receive(line);
            if (done) break;
          }
          await receive(buffer);
          if (!receivedResult)
            throw new Error(
              "The connection ended before your agent finished. Please try again.",
            );
        } finally {
          reader.releaseLock();
        }
      }
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function decide(
    receipt: Receipt,
    action: "approve" | "decline" | "retry",
  ) {
    if (busy) return;
    setBusy(true);
    setProgressEvents([
      {
        stage: action === "decline" ? "policy" : "payment",
        kind: "info",
        title:
          action === "retry"
            ? "Checking payment confirmation…"
            : action === "approve"
              ? "Submitting your approval…"
              : "Declining this gift…",
        detail:
          action === "decline"
            ? "Updating this decision without making a payment."
            : "Confirming this purchase before updating its receipt.",
      },
    ]);
    setError("");
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, receiptId: receipt.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setWallet(data.wallet);
      setResults((old) => {
        const r = old[receipt.profileId];
        return r
          ? {
              ...old,
              [receipt.profileId]: {
                ...r,
                receipt: data.receipt,
                summary:
                  data.receipt?.status === "paid"
                    ? data.receipt.payment?.provider === "stripe"
                      ? "Your Stripe sandbox payment is confirmed. The receipt records the transaction and policy checks."
                      : "Your mock purchase is complete."
                    : data.receipt?.status === "processing"
                      ? "Payment confirmation is pending. Check payment status before trying another purchase."
                      : data.receipt?.status === "failed"
                        ? "The payment failed. Review the payment details below."
                        : "Gift declined. No payment was made.",
              },
            }
          : old;
      });
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not update this purchase.",
      );
    } finally {
      setBusy(false);
    }
  }
  function newPerson() {
    setMemoryStatus("");
    setEditing({
      id: crypto.randomUUID(),
      name: "",
      relation: "Friend",
      initials: "",
      color: "#d8e3d4",
      occasion: "Birthday",
      date: "2026-12-01",
      budget: 5000,
      notes: "",
      dislikes: [],
      owned: [],
      interests: [],
    });
  }
  function navigate(v: View) {
    setView(v);
    setMobile(false);
  }
  const receiptView = (r: Receipt) => (
    <div className="receipt" key={r.id}>
      <div className="receipt-top">
        <span className={`status ${r.status}`}>
          <span />
          {r.status === "paid"
            ? r.payment?.provider === "stripe"
              ? `Stripe sandbox ${r.payment.type === "transfer" ? "transfer" : "payment"} complete`
              : "Mock purchase complete"
            : r.status === "pending"
              ? "Needs your approval"
              : r.status === "processing"
                ? "Payment confirmation pending"
                : r.status === "failed"
                  ? "Payment failed"
                  : "Declined"}
        </span>
        <strong>{money(r.total)}</strong>
      </div>
      <h3>{catalog.find((p) => p.id === r.productId)?.name}</h3>
      <p>
        For {r.name} · {catalog.find((p) => p.id === r.productId)?.merchant}
      </p>
      <p className="receipt-reason">{r.reason}</p>
      <blockquote>“{r.evidence}”</blockquote>
      {r.rules.length > 0 && (
        <div className="rule-list">
          {r.rules.map((rule) => (
            <span key={rule}>
              <Check size={12} />
              {rule}
            </span>
          ))}
        </div>
      )}
      {r.payment?.provider === "stripe" && (
        <div className={`stripe-payment ${r.payment.status}`}>
          <div className="stripe-payment-heading">
            <CreditCard size={14} />
            <strong>Stripe sandbox</strong>
            <span>TEST FUNDS</span>
          </div>
          {r.payment.id && (
            <a
              className="stripe-transaction"
              href={`https://dashboard.stripe.com/test/${r.payment.type === "transfer" ? "connect/transfers" : "payments"}/${r.payment.id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {r.payment.type === "transfer" ? "Transfer" : "Payment"}{" "}
              {r.payment.id}
              <ArrowUpRight size={13} />
            </a>
          )}
          {typeof r.payment.balanceBefore === "number" &&
            typeof r.payment.balanceAfter === "number" && (
              <div className="stripe-balance-change">
                <span>Platform GBP balance</span>
                <strong>
                  {money(r.payment.balanceBefore)}
                  <ArrowRight size={12} />
                  {money(r.payment.balanceAfter)}
                </strong>
              </div>
            )}
          {r.payment.destination && (
            <p className="stripe-destination">
              Approved merchant account <code>{r.payment.destination}</code>
            </p>
          )}
          {r.payment.error && (
            <p className="stripe-payment-error">{r.payment.error}</p>
          )}
          {r.status === "processing" && (
            <p>
              Payment confirmation is pending. Check its status before making
              another purchase.
            </p>
          )}
          {r.status === "failed" && <p>This gift has not been marked paid.</p>}
        </div>
      )}
      <small>
        Decision {r.id.slice(0, 8)} · {new Date(r.at).toLocaleString("en-GB")} ·
        {r.payment?.provider === "stripe"
          ? "Stripe sandbox · test funds"
          : "Simulated funds"}
      </small>
      {r.status === "processing" && (
        <div className="actions">
          <button
            className="primary"
            disabled={busy}
            onClick={() => decide(r, "retry")}
          >
            <LoaderCircle size={14} className={busy ? "spin" : ""} />
            Check payment
          </button>
        </div>
      )}
      {r.status === "pending" && (
        <div className="actions">
          <button
            className="primary"
            disabled={busy}
            onClick={() => decide(r, "approve")}
          >
            Approve {money(r.total)} <Check size={15} />
          </button>
          <button
            className="secondary"
            disabled={busy}
            onClick={() => decide(r, "decline")}
          >
            Decline
          </button>
        </div>
      )}
    </div>
  );
  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobile ? "mobile-open" : ""}`}>
        <Link href="/" className="wordmark">
          stroy<span>✳</span>
        </Link>
        <nav>
          {nav.map((n) => (
            <button
              key={n.id}
              onClick={() => navigate(n.id)}
              className={view === n.id ? "active" : ""}
            >
              <n.icon size={18} />
              {n.label}
              {n.id === "activity" && pending.length > 0 && (
                <b className="nav-count">{pending.length}</b>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <nav>
            <button
              className={view === "wallet" ? "active" : ""}
              onClick={() => navigate("wallet")}
            >
              <WalletIcon size={18} />
              Wallet{" "}
              <span className="tiny-badge">
                {stripeEnabled ? "SANDBOX" : "DEMO"}
              </span>
            </button>
            <button
              className={view === "settings" ? "active" : ""}
              onClick={() => navigate("settings")}
            >
              <SlidersHorizontal size={18} />
              Spending rules
            </button>
            <button onClick={() => setHelp(true)}>
              <CircleHelp size={18} />
              How it works
            </button>
          </nav>
          <div className="account">
            <span className="user-avatar">D</span>
            <div>
              Personal workspace<small>Demo account</small>
            </div>
            <span className="online-dot" />
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div>
            <button
              className="mobile-toggle icon-button"
              aria-label="Toggle navigation"
              onClick={() => setMobile(!mobile)}
            >
              <Menu size={20} />
            </button>
            <span>Your space</span>
            <ChevronRight size={13} />
            <strong>
              {view === "overview"
                ? "People"
                : view === "people"
                  ? "Your people"
                  : view === "occasions"
                    ? "Occasions"
                    : view === "activity"
                      ? "Agent activity"
                      : view === "wallet"
                        ? "Wallet"
                        : "Spending rules"}
            </strong>
          </div>
          <div>
            <span className="demo-label">
              <span />
              {stripeEnabled
                ? "Stripe sandbox · test funds"
                : "Demo · simulated funds"}
            </span>
            <span className="user-avatar small">D</span>
          </div>
        </header>
        <main>
          <div className="page-heading">
            <div>
              <h1>
                {view === "overview"
                  ? "Good gifts start here."
                  : view === "people"
                    ? "Your people."
                    : view === "occasions"
                      ? "Days worth remembering."
                      : view === "activity"
                        ? "Every decision, explained."
                        : view === "wallet"
                          ? "Your wallet."
                          : "Your spending rules."}
              </h1>
              <p>
                {view === "overview"
                  ? "Tell us about someone. Your agent finds the thoughtful part."
                  : view === "people"
                    ? "A little context makes a better gift."
                    : view === "occasions"
                      ? "Keep the meaningful moments close."
                      : view === "activity"
                        ? "See what your concierge considered, chose, and why."
                        : view === "wallet"
                          ? "Your gifting budget, with a clear story behind every pound."
                          : "You set the limits. Your agent follows them."}
              </p>
            </div>
            {["overview", "people", "occasions"].includes(view) && (
              <button className="primary" onClick={newPerson}>
                <Plus size={16} />
                Add a person
              </button>
            )}
          </div>
          <p role="status">
            {memoryStatus ||
              "People and their details save automatically to Cognee memory."}
          </p>
          {error && (
            <div role="alert" className="error-banner">
              {error}
              <button
                className="icon-button"
                aria-label="Dismiss error"
                onClick={() => setError("")}
              >
                <X size={16} />
              </button>
            </div>
          )}
          {view === "overview" && (
            <div className="balance-strip">
              <span>
                <WalletIcon size={17} />{" "}
                {stripeEnabled ? "Spending allowance" : "Demo balance"}{" "}
                <strong>{money(wallet.balance)}</strong>
              </span>
              <button
                className="text-button"
                onClick={() => navigate("settings")}
              >
                <ShieldCheck size={15} />{" "}
                {policy.autopilot
                  ? `Auto-buy up to ${money(policy.autoLimit)}`
                  : "All gifts need approval"}
                <ArrowRight size={14} />
              </button>
            </div>
          )}
          {["overview", "people", "occasions"].includes(view) && (
            <section className="people-section">
              <div className="people-grid">
                {people.map((p, i) => (
                  <article
                    className="person-card"
                    key={p.id}
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    <div className="person-top">
                      <span
                        className="person-avatar"
                        style={{ background: p.color }}
                      >
                        {p.initials}
                      </span>
                      <div>
                        <h3>{p.name}</h3>
                        <span>{p.relation}</span>
                      </div>
                      <button
                        className="icon-button edit-person"
                        onClick={() => {
                          setMemoryStatus("");
                          setEditing({ ...p });
                        }}
                        aria-label={`Edit ${p.name}`}
                      >
                        <Pencil size={15} />
                      </button>
                    </div>
                    <div className="occasion-line">
                      <CalendarDays size={14} />
                      <span>{p.occasion}</span>
                      <strong>{dateLabel(p.date)}</strong>
                    </div>
                    <div className="interest-tags">
                      {(p.interests.length
                        ? p.interests
                        : ["Add their interests"]
                      ).map((t) => (
                        <span key={t}>{t}</span>
                      ))}
                    </div>
                    <p className="person-note">
                      “{p.notes.split(". ")[0].replace(/\.$/, "")}.”
                    </p>
                    <div className="person-footer">
                      <span>
                        Gift budget <strong>{money(p.budget)}</strong>
                      </span>
                      <button disabled={busy} onClick={() => run(p)}>
                        Find a gift <Sparkles size={14} />
                      </button>
                    </div>
                  </article>
                ))}
                <button className="add-person-card" onClick={newPerson}>
                  <span>
                    <Plus size={22} />
                  </span>
                  <h3>Someone else?</h3>
                  <p>Add a person to your circle.</p>
                  <b>
                    Add a person <ArrowUpRight size={13} />
                  </b>
                </button>
              </div>
            </section>
          )}
          {view === "activity" && (
            <div className="activity-layout">
              <section>
                <div className="section-heading">
                  <h2>Purchase history</h2>
                  <span className="muted">
                    {wallet.receipts.length} decisions
                  </span>
                </div>
                {wallet.receipts.length ? (
                  wallet.receipts.map(receiptView)
                ) : (
                  <div className="empty-state">
                    <History size={32} />
                    <h3>No purchases yet.</h3>
                    <p>
                      Run your concierge for someone you care about. Every
                      decision will appear here.
                    </p>
                    <button
                      className="primary"
                      onClick={() => navigate("people")}
                    >
                      Choose a person <ArrowRight size={15} />
                    </button>
                  </div>
                )}
              </section>
              <section className="trace-panel">
                <span className="eyebrow">BEHIND THE THOUGHT</span>
                <h2>Agent decisions</h2>
                {Object.entries(results).length ? (
                  Object.entries(results).map(([id, r]) => (
                    <div key={id}>
                      <h3>{people.find((p) => p.id === id)?.name}</h3>
                      {r.trace.map((t, i) => (
                        <div className={`trace-row ${t.kind}`} key={i}>
                          <span>
                            {t.kind === "success" ? (
                              <Check size={13} />
                            ) : (
                              <Sparkles size={13} />
                            )}
                          </span>
                          <div>
                            <strong>{t.title}</strong>
                            <p>{t.detail}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))
                ) : (
                  <p className="muted">
                    The notes, evidence and policy checks behind each gift will
                    live here.
                  </p>
                )}
              </section>
            </div>
          )}
          {view === "wallet" && (
            <>
              <div className="wallet-layout">
                <section className="balance-card">
                  <span className="eyebrow">
                    {stripeEnabled
                      ? "YOUR GIFTING ALLOWANCE · SANDBOX"
                      : "YOUR GIFTING WALLET · SIMULATION"}
                  </span>
                  <h2>{money(wallet.balance)}</h2>
                  <p>
                    {stripeEnabled
                      ? "Remaining spending allowance"
                      : "Available demo balance"}
                  </p>
                  <div>
                    <span>
                      Starting balance<strong>£300</strong>
                    </span>
                    <span>
                      Spent on gifts
                      <strong>{money(30000 - wallet.balance)}</strong>
                    </span>
                    <span>
                      Awaiting approval
                      <strong>
                        {money(pending.reduce((sum, r) => sum + r.total, 0))}
                      </strong>
                    </span>
                  </div>
                  <small>
                    {stripeEnabled
                      ? "This allowance sets your spending ceiling. Stripe sandbox funds are shown separately."
                      : "Mock funds only. No card connected. No real purchases."}
                  </small>
                </section>
                <div className="wallet-note">
                  {stripeEnabled ? (
                    <CreditCard size={30} />
                  ) : (
                    <ShieldCheck size={30} />
                  )}
                  <h2>
                    {stripeEnabled
                      ? "Stripe sandbox balance"
                      : "You’re in control."}
                  </h2>
                  {stripeEnabled && (
                    <strong className="stripe-wallet-balance">
                      {typeof wallet.stripeBalance === "number"
                        ? money(wallet.stripeBalance)
                        : "Unavailable"}
                    </strong>
                  )}
                  <p>
                    {stripeEnabled
                      ? "Available GBP in the Stripe platform sandbox. Successful transfers move test funds to approved merchant accounts. No live money or real orders."
                      : "Your balance is only reduced after a gift passes the spending rules. Approval requests don’t deduct any funds."}
                  </p>
                  {stripeEnabled && wallet.stripeConfigured === false && (
                    <p className="stripe-wallet-warning">
                      Stripe sandbox could not be reached. Payments will not
                      silently fall back to mock funds.
                    </p>
                  )}
                  <button
                    className="text-button"
                    onClick={() => navigate("settings")}
                  >
                    Review your spending rules <ArrowRight size={15} />
                  </button>
                </div>
              </div>
              <div className="section-heading">
                <h2>Recent decisions</h2>
                <span className="muted">
                  {paid.length} completed{" "}
                  {stripeEnabled ? "sandbox payments" : "mock purchases"}
                </span>
              </div>
              {wallet.receipts.length ? (
                wallet.receipts.map(receiptView)
              ) : (
                <div className="empty-state">
                  <Gift size={30} />
                  <h3>No purchases yet.</h3>
                  <p>Your first gift will appear here.</p>
                </div>
              )}
            </>
          )}
          {view === "settings" && (
            <section className="settings-card">
              <div className="settings-intro">
                <ShieldCheck size={26} />
                <div>
                  <h2>Control how your agent spends.</h2>
                  <p>Hard checks run in code before any payment.</p>
                </div>
              </div>
              <div className="setting-row">
                <div>
                  <h3>Automatic purchases</h3>
                  <p>
                    Automatically buy gifts that meet every rule and fit your
                    approval limit.
                  </p>
                </div>
                <button
                  role="switch"
                  aria-label="Automatic purchases"
                  aria-checked={policy.autopilot}
                  className={`toggle ${policy.autopilot ? "on" : ""}`}
                  onClick={() =>
                    setPolicy({ ...policy, autopilot: !policy.autopilot })
                  }
                >
                  <span />
                </button>
              </div>
              <div className="setting-row">
                <div>
                  <h3>Automatic purchase limit</h3>
                  <p>
                    Anything above this amount needs your approval. Recipient
                    budgets still apply.
                  </p>
                </div>
                <label className="currency-input">
                  £
                  <input
                    aria-label="Automatic purchase limit in pounds"
                    type="number"
                    min="0"
                    max="1000"
                    value={policy.autoLimit / 100}
                    onChange={(e) =>
                      setPolicy({
                        ...policy,
                        autoLimit: Math.max(
                          0,
                          Math.min(
                            100000,
                            Math.round(Number(e.target.value) * 100),
                          ),
                        ),
                      })
                    }
                  />
                </label>
              </div>
              <div className="merchant-settings">
                <h3>Approved demo merchants</h3>
                <p>Your agent can only buy from the studios you select.</p>
                <div>
                  {merchants.map((m) => (
                    <label key={m}>
                      <input
                        type="checkbox"
                        checked={policy.allowedMerchants.includes(m)}
                        onChange={(e) =>
                          setPolicy({
                            ...policy,
                            allowedMerchants: e.target.checked
                              ? [...policy.allowedMerchants, m]
                              : policy.allowedMerchants.filter((x) => x !== m),
                          })
                        }
                      />
                      {m}
                      <span>Demo studio</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="policy-note">
                <CheckCheck size={18} />
                <p>
                  Always enforced: total budget including delivery, sufficient
                  funds, item availability, arrival date, explicit dislikes,
                  already-owned items, and no duplicate gift for the same
                  occasion.
                </p>
              </div>
              <small className="muted">
                Changes save automatically on this browser. Pending gifts retain
                the policy recorded when they were selected.
              </small>
            </section>
          )}
          <footer>
            <Link href="/" className="footer-brand">
              stroy ✳
            </Link>
            <span>Thoughtfully chosen. Clearly explained.</span>
            <span>
              {stripeEnabled
                ? "Stripe sandbox · no live money"
                : "Demo · no real money moves"}
            </span>
          </footer>
        </main>
      </div>
      {showAgent && (
        <div
          className="overlay concierge-overlay"
          onClick={() => !busy && setShowAgent(false)}
        >
          <section
            className="agent-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Your gifting concierge"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="drawer-header">
              <span className="eyebrow">
                <Sparkles size={13} />
                YOUR GIFT AGENT
              </span>
              <button
                className="icon-button"
                aria-label="Close concierge"
                disabled={busy}
                onClick={() => setShowAgent(false)}
              >
                <X size={20} />
              </button>
            </div>
            <h2>
              Gifts for <em>{current?.name.split(" ")[0]}.</em>
            </h2>
            <p className="muted">
              Personal picks. Clear rules.{" "}
              {stripeEnabled
                ? "Stripe sandbox payments."
                : "Simulated purchases."}
            </p>
            <div className="agent-controls">
              <select
                aria-label="Choose recipient"
                disabled={busy}
                value={current?.id}
                onChange={(e) => setSelected(e.target.value)}
              >
                {people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} · {p.relation}
                  </option>
                ))}
              </select>
              <button
                className="primary"
                disabled={busy}
                onClick={() => run(current)}
              >
                {busy ? (
                  <LoaderCircle className="spin" size={16} />
                ) : (
                  <Sparkles size={16} />
                )}{" "}
                {busy
                  ? "Thinking…"
                  : result
                    ? "Find again"
                    : "Find the right gift"}
              </button>
            </div>
            <div className="agent-budget">
              <span>
                <Gift size={14} />
                {current?.occasion} · {dateLabel(current.date)}
              </span>
              <strong>Up to {money(current.budget)}</strong>
            </div>
            {error && (
              <div className="error-banner" role="alert">
                {error}
              </div>
            )}
            {busy &&
              (() => {
                const active = progressEvents[progressEvents.length - 1];
                const ActiveIcon = active
                  ? stageIcons[active.stage] || Sparkles
                  : Sparkles;
                return (
                  <section
                    className={`agent-live stage-${active?.stage || "profile"}`}
                    aria-label="Live agent activity"
                  >
                    <div className="live-heading">
                      <span className="live-indicator" />
                      LIVE AGENT ACTIVITY
                      <span className="live-running">
                        Working for {current?.name.split(" ")[0]}
                      </span>
                    </div>
                    <div
                      className="live-stage"
                      role="status"
                      aria-live="polite"
                    >
                      <div
                        className="live-stage-orb"
                        key={active?.stage || "starting"}
                      >
                        <ActiveIcon size={27} />
                        {active?.stage === "research" && (
                          <span className="live-search-globe">
                            <Globe size={14} />
                          </span>
                        )}
                      </div>
                      <h3>{active?.title || "Starting your gift agent…"}</h3>
                      <p>
                        {active?.detail ||
                          "Connecting to your agent. Its progress will appear here as it works."}
                      </p>
                      <div className="live-scanning">
                        <span />
                      </div>
                    </div>
                    {progressEvents.length > 0 && (
                      <div
                        className="live-events"
                        role="log"
                        aria-label="Agent progress events"
                        aria-live="polite"
                      >
                        {progressEvents.map((event, i) => {
                          const EventIcon =
                            event.kind === "success"
                              ? Check
                              : stageIcons[event.stage] || Sparkles;
                          const isCurrent = i === progressEvents.length - 1;
                          return (
                            <div
                              className={`live-event ${isCurrent ? "is-current" : ""} ${event.kind}`}
                              key={`${i}-${event.stage}`}
                            >
                              <span className="live-event-icon">
                                <EventIcon size={14} />
                              </span>
                              <div>
                                <strong>{event.title}</strong>
                                <p>{event.detail}</p>
                              </div>
                              {isCurrent && (
                                <LoaderCircle
                                  size={13}
                                  className="spin live-event-loading"
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <small className="live-footnote">
                      <ShieldCheck size={12} />
                      Progress comes directly from your agent. Your spending
                      rules stay in force.
                    </small>
                  </section>
                );
              })()}
            {!busy && result && (
              <>
                <div className="agent-summary">
                  <Sparkles size={19} />
                  <p>{result.summary}</p>
                </div>
                <h3 className="drawer-section-title">What we know</h3>
                <div className="evidence-list">
                  {result.interests.map((interest, i) => (
                    <div key={i}>
                      <span>
                        {interest.name}
                        <small>
                          {interest.inferred ? "Inferred" : "From your notes"}
                        </small>
                      </span>
                      <p>“{interest.evidence}”</p>
                    </div>
                  ))}
                </div>
                {result.research && result.research.status !== "catalog" && (
                  <section
                    className="web-research"
                    aria-label="Live gift research"
                  >
                    <div className="research-heading">
                      <span className="eyebrow">LIVE RESEARCH</span>
                      <span className="research-status">
                        {result.research.status === "complete"
                          ? "Live · Tavily"
                          : result.research.status === "partial"
                            ? "Partial results"
                            : "Search unavailable"}
                      </span>
                    </div>
                    <h3 className="drawer-section-title">What’s out there</h3>
                    <p className="muted">
                      {result.research.status === "unavailable"
                        ? "We couldn’t find live sources this time. The recommendations below use available gift selections."
                        : `Searched ${new Date(result.research.searchedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}. Trends inspire ideas; your notes tell us what fits.`}
                    </p>
                    {result.research.status === "partial" && (
                      <p className="research-caution">
                        One search couldn’t finish. These are the sources we
                        could retrieve.
                      </p>
                    )}
                    <div className="trend-insights">
                      {result.research.insights.map((insight, i) => (
                        <article key={i}>
                          <span className="eyebrow">
                            TREND SIGNAL {String(i + 1).padStart(2, "0")}
                          </span>
                          <p>{insight.text}</p>
                          <div className="source-links">
                            {insight.sourceIds.map((id) => {
                              const source = result.research?.sources.find(
                                (s) => s.id === id,
                              );
                              return source ? (
                                <a
                                  key={id}
                                  href={source.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  {new URL(source.url).hostname.replace(
                                    /^www\./,
                                    "",
                                  )}{" "}
                                  <ArrowUpRight size={12} />
                                </a>
                              ) : null;
                            })}
                          </div>
                        </article>
                      ))}
                    </div>
                    {result.research.gifts.length > 0 && (
                      <>
                        <h4 className="web-gifts-title">Gift ideas online</h4>
                        <div className="web-gifts">
                          {result.research.gifts.map((gift, i) => {
                            const source = result.research?.sources.find(
                              (s) => s.id === gift.sourceId,
                            );
                            if (!source) return null;
                            return (
                              <article key={`${gift.sourceId}-${i}`}>
                                <div className="web-gift-preview">
                                  <ProductPhoto
                                    id={giftIllustration(
                                      gift.name,
                                      gift.reason,
                                    )}
                                    illustrative
                                  />
                                  <span>Illustrative photo</span>
                                </div>
                                <div className="web-gift-copy">
                                  <span className="eyebrow">
                                    LIVE WEB FIND · RESEARCH ONLY
                                  </span>
                                  <h3>{gift.name}</h3>
                                  <p>{gift.reason}</p>
                                  <a
                                    className="text-button"
                                    href={source.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    Explore{" "}
                                    {new URL(source.url).hostname.replace(
                                      /^www\./,
                                      "",
                                    )}{" "}
                                    <ArrowUpRight size={14} />
                                  </a>
                                  <small>
                                    Check the seller’s current price, stock and
                                    delivery.
                                  </small>
                                </div>
                              </article>
                            );
                          })}
                        </div>
                      </>
                    )}
                    {result.research.sources.length > 0 && (
                      <details className="research-sources">
                        <summary>
                          Sources & search queries <ChevronRight size={14} />
                        </summary>
                        {result.research.queries.map((q) => (
                          <p key={q.kind}>
                            <strong>
                              {q.kind === "trend" ? "Trends" : "Gift search"}
                            </strong>{" "}
                            · {q.query}
                            {q.status === "failed" ? " · unavailable" : ""}
                          </p>
                        ))}
                        {result.research.sources.map((source) => (
                          <a
                            key={source.id}
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <span>
                              {source.kind === "trend"
                                ? "INSPIRATION"
                                : "GIFT SOURCE"}{" "}
                              · {source.id}
                            </span>
                            {source.title}
                            <ArrowUpRight size={12} />
                          </a>
                        ))}
                      </details>
                    )}
                  </section>
                )}
                <h3 className="drawer-section-title">Selected for you</h3>
                <div className="recommendations">
                  {result.recommendations.map((r, i) => {
                    const p = catalog.find((p) => p.id === r.productId)!;
                    return (
                      <article className="product-card" key={r.productId}>
                        <ProductPhoto id={p.id} />
                        <div>
                          <span className="eyebrow">
                            {i === 0 ? "SELECTED FOR YOU" : "ANOTHER THOUGHT"}
                          </span>
                          <h3>{p.name}</h3>
                          <span className="muted">{p.merchant}</span>
                          <p>{r.reason}</p>
                          {(r.sourceIds?.length || 0) > 0 && (
                            <div className="source-links">
                              {r.sourceIds?.map((id) => {
                                const source = result.research?.sources.find(
                                  (s) => s.id === id,
                                );
                                return source ? (
                                  <a
                                    key={id}
                                    href={source.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    Inspiration ·{" "}
                                    {new URL(source.url).hostname.replace(
                                      /^www\./,
                                      "",
                                    )}{" "}
                                    <ArrowUpRight size={11} />
                                  </a>
                                ) : null;
                              })}
                            </div>
                          )}
                          <div className="product-price">
                            <strong>{money(p.price + p.shipping)}</strong>
                            <small>including delivery · {p.days} days</small>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
                {result.receipt &&
                  receiptView(
                    wallet.receipts.find((r) => r.id === result.receipt?.id) ||
                      result.receipt,
                  )}
                <details className="agent-details">
                  <summary>
                    See the agent’s decisions <ChevronRight size={16} />
                  </summary>
                  {result.trace.map((t, i) => (
                    <div className={`trace-row ${t.kind}`} key={i}>
                      <span>
                        <Check size={13} />
                      </span>
                      <div>
                        <strong>{t.title}</strong>
                        <p>{t.detail}</p>
                      </div>
                    </div>
                  ))}
                </details>
              </>
            )}
            {!busy && !result && (
              <div className="concierge-empty">
                <ProductPhoto id="cups" />
                <h3>A good gift starts with a little attention.</h3>
                <p>
                  I’ll read your notes, find thoughtful gift ideas, and choose
                  from our demo catalog within your spending rules. Online
                  research is enabled in production; the local demo uses the
                  catalog.
                </p>
                <div>
                  <ShieldCheck size={15} />
                  {stripeEnabled
                    ? "Test funds only. No live money or real orders."
                    : "No real money moves in this demo."}
                </div>
              </div>
            )}
          </section>
        </div>
      )}
      {editing && (
        <div
          className="overlay modal-overlay"
          onClick={() => {
            setEditing(null);
          }}
        >
          <section
            className="profile-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="drawer-header">
              <span className="eyebrow">A PERSON, NOT A PROFILE</span>
              <button
                className="icon-button"
                aria-label="Close profile"
                onClick={() => {
                  setEditing(null);
                }}
              >
                <X size={20} />
              </button>
            </div>
            <h2 id="profile-title">A little about them.</h2>
            <form
              aria-busy={savingPerson}
              onSubmit={(e) => {
                e.preventDefault();
                setEditing(editing);
                setEditingState(null);
              }}
            >
              <div className="form-grid">
                <label>
                  Name
                  <input
                    required
                    maxLength={80}
                    value={editing.name}
                    onChange={(e) =>
                      setEditing({ ...editing, name: e.target.value })
                    }
                    placeholder="Someone who matters"
                  />
                </label>
                <label>
                  Relationship
                  <input
                    required
                    value={editing.relation}
                    onChange={(e) =>
                      setEditing({ ...editing, relation: e.target.value })
                    }
                  />
                </label>
                <label>
                  Occasion
                  <input
                    required
                    value={editing.occasion}
                    onChange={(e) =>
                      setEditing({ ...editing, occasion: e.target.value })
                    }
                  />
                </label>
                <label>
                  Date
                  <input
                    required
                    type="date"
                    value={editing.date}
                    onChange={(e) =>
                      setEditing({ ...editing, date: e.target.value })
                    }
                  />
                </label>
                <label>
                  Gift budget (£)
                  <input
                    required
                    type="number"
                    min="1"
                    max="1000"
                    value={editing.budget / 100}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        budget: Math.round(Number(e.target.value) * 100),
                      })
                    }
                  />
                </label>
                <label>
                  Interests, separated by commas
                  <input
                    value={editing.interests.join(",")}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        interests: e.target.value.split(","),
                      })
                    }
                  />
                </label>
              </div>
              <div className="form-grid">
                <label>
                  Birthday (optional)
                  <input
                    type="date"
                    value={editing.birthday || ""}
                    onChange={(e) =>
                      setEditing({ ...editing, birthday: e.target.value })
                    }
                  />
                </label>
                <label>
                  Address (optional)
                  <textarea
                    rows={3}
                    maxLength={500}
                    autoComplete="off"
                    value={editing.address || ""}
                    onChange={(e) =>
                      setEditing({ ...editing, address: e.target.value })
                    }
                  />
                </label>
              </div>
              <p id="memory-status" role="status">
                {memoryStatus ||
                  "Details save automatically to Cognee, including any address, once required fields are complete. Each person has a separate memory in this browser session."}
              </p>
              <label>
                The things that make them, them
                <textarea
                  required
                  minLength={5}
                  maxLength={3000}
                  rows={5}
                  value={editing.notes}
                  onChange={(e) =>
                    setEditing({ ...editing, notes: e.target.value })
                  }
                  placeholder="Their favourite Sunday ritual. Something they mentioned. A thing they’ve always wanted to try…"
                />
              </label>
              <div className="form-grid">
                <label>
                  Dislikes (comma separated)
                  <input
                    value={editing.dislikes.join(",")}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        dislikes: e.target.value
                          ? e.target.value.split(",")
                          : [],
                      })
                    }
                  />
                </label>
                <label>
                  Already owns (comma separated)
                  <input
                    value={editing.owned.join(",")}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        owned: e.target.value ? e.target.value.split(",") : [],
                      })
                    }
                  />
                </label>
              </div>
              <div className="form-footer">
                <span>
                  <ShieldCheck size={14} />
                  Browser copy + Cognee memory
                </span>
                <button
                  className="primary"
                  type="submit"
                  aria-describedby="memory-status"
                >
                  Done <ArrowRight size={15} />
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
      {help && (
        <div className="overlay modal-overlay" onClick={() => setHelp(false)}>
          <section
            className="profile-modal help-modal"
            role="dialog"
            aria-modal="true"
            aria-label="About stroy"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="drawer-header">
              <span className="eyebrow">HOW IT WORKS</span>
              <button
                className="icon-button"
                aria-label="Close guidance"
                onClick={() => setHelp(false)}
              >
                <X size={20} />
              </button>
            </div>
            <h2>Thoughtful gifts, clear rules.</h2>
            <p>
              Start with Alex or Sophie, or add someone of your own. Edit their
              notes, occasion, and budget, then choose “Find a gift.”
            </p>
            <p>
              Our OpenAI agent builds an interest profile from your notes. In
              production, Tavily researches trends and real gift ideas with
              source links. Locally, the demo uses our catalog without web
              searches. Generic interests and your budget are used for web
              searches; we do not search for the person’s identity. Personal fit
              comes first.
            </p>
            <p>
              Under your automatic limit, the agent can purchase independently.
              Above it, you approve or decline. Every decision includes the
              evidence and spending rules.
            </p>
            <p>
              People are saved in this browser and automatically synced to
              Cognee as you update their details. Wallet state is kept in a
              signed cookie. It is not a real financial ledger. Clearing browser
              data starts a new demo and loses access to its Cognee memory;
              cloud records remain in Cognee. Live web finds are research only:
              check the seller’s price, stock and delivery. Catalog purchases
              use eight fictional products. When configured, Stripe sandbox
              transfers move test funds to approved merchant accounts; otherwise
              payments use a mock wallet. Email reminders and real orders are
              not enabled.
            </p>
            <button className="primary" onClick={() => setHelp(false)}>
              Got it <ArrowRight size={15} />
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
