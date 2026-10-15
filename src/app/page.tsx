"use client";
import Link from "next/link";
import { useEffect, useEffectEvent, useState } from "react";
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
  Leaf,
  Pencil,
  CircleHelp,
  CheckCheck,
  History,
  Menu,
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
type View =
  "overview" | "people" | "occasions" | "activity" | "wallet" | "settings";
const nav = [
  { id: "overview", label: "Overview", icon: Gift },
  { id: "people", label: "Your people", icon: Users },
  { id: "occasions", label: "Occasions", icon: CalendarDays },
  { id: "activity", label: "Agent activity", icon: Sparkles },
] as const;
function GiftArt({
  type = "gift",
  className = "",
}: {
  type?: string;
  className?: string;
}) {
  return (
    <div className={`gift-art art-${type} ${className}`} aria-hidden="true">
      <svg viewBox="0 0 300 250" fill="none">
        <ellipse
          cx="151"
          cy="216"
          rx="94"
          ry="13"
          fill="#254535"
          opacity=".09"
        />
        {type === "coffee" ? (
          <>
            <path d="M84 69h93l12 140H72L84 69Z" fill="#bd8962" />
            <path d="M84 69h93l-8-16H92l-8 16Z" fill="#715443" />
            <path d="M79 113h104v59H79z" fill="#eee5d4" />
            <text
              x="131"
              y="138"
              textAnchor="middle"
              fill="#344c3b"
              fontSize="15"
              fontFamily="Georgia"
            >
              ORIGIN
            </text>
            <text
              x="131"
              y="155"
              textAnchor="middle"
              fill="#647060"
              fontSize="7"
              letterSpacing="2"
            >
              DISCOVERY SET
            </text>
            <path d="M188 150h48v42c0 26-48 26-48 0v-42Z" fill="#eee9dd" />
            <path
              d="M235 158c28-8 27 38 0 27"
              stroke="#d0c7b6"
              strokeWidth="9"
            />
            <ellipse cx="212" cy="151" rx="24" ry="7" fill="#654732" />
          </>
        ) : type === "cups" ? (
          <>
            <path d="M54 116h87v69c0 43-87 43-87 0v-69Z" fill="#ceae8b" />
            <ellipse cx="97" cy="116" rx="43" ry="12" fill="#9d7f62" />
            <path
              d="M141 131c43-13 42 52 0 41"
              stroke="#ceae8b"
              strokeWidth="13"
            />
            <path d="M168 88h74v67c0 37-74 37-74 0V88Z" fill="#e9e1cd" />
            <ellipse cx="205" cy="88" rx="37" ry="10" fill="#bbb59f" />
            <path
              d="M241 101c35-8 34 42 0 36"
              stroke="#e9e1cd"
              strokeWidth="12"
            />
          </>
        ) : type === "pottery" ? (
          <>
            <ellipse cx="151" cy="202" rx="87" ry="14" fill="#b6b6a2" />
            <path
              d="M110 87c-8 39-36 53-31 85 5 38 131 38 137 0 5-32-23-46-31-85"
              fill="#bd8c6d"
            />
            <ellipse cx="147" cy="87" rx="38" ry="11" fill="#90694f" />
            <ellipse cx="147" cy="88" rx="26" ry="5" fill="#70523e" />
            <path
              d="M84 156c31 15 93 16 127 0M86 171c29 14 88 15 122 1M98 119c23 12 73 12 99 0"
              stroke="#d4a789"
              strokeWidth="3"
            />
            <path
              d="M81 67c-21 28-30 47-20 61M224 59c19 27 26 48 15 65"
              stroke="#e0bba1"
              strokeWidth="15"
              strokeLinecap="round"
            />
          </>
        ) : type === "journal" ? (
          <>
            <path d="m87 57 120 20-10 141-120-20L87 57Z" fill="#5d7057" />
            <path d="m87 57 9 2-10 141-9-2L87 57Z" fill="#344d3c" />
            <path d="m95 196 101 17" stroke="#eee4cc" strokeWidth="5" />
            <text
              x="144"
              y="125"
              fill="#eee4cc"
              textAnchor="middle"
              fontSize="14"
              fontFamily="Georgia"
              transform="rotate(8 144 125)"
            >
              FIELD NOTES
            </text>
            <path d="m213 99 7 1-8 100-7-1z" fill="#b98c4c" />
          </>
        ) : type === "flowers" ? (
          <>
            <path d="m109 151 14 64h62l15-64" fill="#d5c2a8" />
            <path
              d="m150 174-25-95m30 99 27-112m-29 106 2-120m-5 121-53-45m57 43 50-59"
              stroke="#627c57"
              strokeWidth="4"
            />
            {[
              [122, 81],
              [183, 71],
              [154, 55],
              [98, 124],
              [204, 117],
            ].map(([x, y], i) => (
              <g key={i}>
                <circle
                  cx={x}
                  cy={y}
                  r="23"
                  fill={i % 2 ? "#e7c6b5" : "#f0dfce"}
                />
                <circle cx={x} cy={y} r="9" fill="#bc9a64" />
              </g>
            ))}
          </>
        ) : (
          <>
            <path d="M67 116 154 87l88 35-87 31-88-37Z" fill="#d4bfa0" />
            <path d="m67 116 88 37v69l-88-39v-67Z" fill="#be9f76" />
            <path d="m155 153 87-31v68l-87 32v-69Z" fill="#d8c3a4" />
            <path
              d="m106 102 88 36v70l-28 10v-71l-87-36 27-9Z"
              fill="#48634a"
            />
            <path d="m199 105-88 31v68l27 12v-70l87-31-26-10Z" fill="#587351" />
            <path
              d="M153 120c-22-6-66-25-55-46 12-25 51 17 55 46Zm0 0c4-27 26-66 43-49 22 23-22 44-43 49Z"
              stroke="#426244"
              strokeWidth="10"
            />
            <path
              d="M151 120c-1-32 7-53 14-62M155 121c24-5 42-1 58 12"
              stroke="#426244"
              strokeWidth="7"
              strokeLinecap="round"
            />
            <path
              d="M43 74c16-6 21-23 20-33-15 3-25 16-20 33ZM249 75c-1-16-11-26-21-29-3 16 7 29 21 29Z"
              fill="#8e9d76"
            />
            <path
              d="M50 88 60 58m173 3 14 25"
              stroke="#8e9d76"
              strokeWidth="2"
            />
          </>
        )}
      </svg>
    </div>
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
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Profile | null>(null);
  const [showAgent, setShowAgent] = useState(false);
  const [ready, setReady] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [help, setHelp] = useState(false);
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
  useEffect(() => {
    if (!busy) return;
    const id = setInterval(() => setProgress((v) => Math.min(v + 1, 3)), 6500);
    return () => clearInterval(id);
  }, [busy]);
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
  async function run(profile: Profile) {
    if (busy) return;
    setSelected(profile.id);
    setShowAgent(true);
    setBusy(true);
    setProgress(0);
    setError("");
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "run", profile, policy }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResults((old) => ({ ...old, [profile.id]: data.result }));
      setWallet(data.wallet);
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
  async function decide(receipt: Receipt, action: "approve" | "decline") {
    if (busy) return;
    setBusy(true);
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
                  action === "approve"
                    ? "Approved by you, taken care of by stroy. Your mock purchase is complete."
                    : "Gift declined. Your wallet balance is unchanged.",
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
            ? "Mock purchase complete"
            : r.status === "pending"
              ? "Needs your approval"
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
      <small>
        Decision {r.id.slice(0, 8)} · {new Date(r.at).toLocaleString("en-GB")} ·
        Simulated funds
      </small>
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
        <p className="brand-caption">THE ART OF GIVING</p>
        <div className="workspace">
          <span className="workspace-icon">D</span>
          <div>
            Your personal space<small>A little more thoughtful</small>
          </div>
        </div>
        <span className="nav-caption">YOUR SPACE</span>
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
              Wallet <span className="tiny-badge">DEMO</span>
            </button>
            <button
              className={view === "settings" ? "active" : ""}
              onClick={() => navigate("settings")}
            >
              <SlidersHorizontal size={18} />
              Spending rules
            </button>
            <button onClick={() => setHelp(true)}>
              <CircleHelp size={18} />A little guidance
            </button>
          </nav>
          <div className="sidebar-note">
            <Leaf size={19} />
            <p>
              Good gifts start with
              <br />
              paying attention.
            </p>
          </div>
          <div className="account">
            <span className="user-avatar">D</span>
            <div>
              Your workspace<small>Personal account</small>
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
                ? "Overview"
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
              Mock money. Real thought.
            </span>
            <span className="user-avatar small">D</span>
          </div>
        </header>
        <main>
          <div className="page-heading">
            <div>
              <span className="eyebrow">A LITTLE THOUGHT GOES A LONG WAY</span>
              <h1>
                {view === "overview"
                  ? "Make someone’s day."
                  : view === "people"
                    ? "Your favourite people."
                    : view === "occasions"
                      ? "Days worth remembering."
                      : view === "activity"
                        ? "Every little decision."
                        : view === "wallet"
                          ? "Room for a little joy."
                          : "Thoughtful, within limits."}
              </h1>
              <p>
                {view === "overview"
                  ? "The right gift. The right moment. The people who matter."
                  : view === "people"
                    ? "The little things you remember become the gifts they love."
                    : view === "occasions"
                      ? "Keep the meaningful moments close."
                      : view === "activity"
                        ? "See what your concierge considered, chose, and why."
                        : view === "wallet"
                          ? "Your gifting budget, with a clear story behind every pound."
                          : "You set the boundaries. Your concierge takes care of the details."}
              </p>
            </div>
            {["overview", "people", "occasions"].includes(view) && (
              <button className="primary" onClick={newPerson}>
                <Plus size={16} />
                Add a person
              </button>
            )}
          </div>
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
            <>
              <section className="hero">
                <div className="hero-copy">
                  <span className="hero-tag">
                    <Sparkles size={13} />
                    YOUR THOUGHTFUL LITTLE ASSISTANT
                  </span>
                  <h2>
                    Less searching.
                    <br />
                    More <em>“you remembered.”</em>
                  </h2>
                  <p>
                    You know your people. stroy connects the little details
                    <br className="desktop-break" /> to a gift that feels just
                    right.
                  </p>
                  <button
                    className="light-button"
                    onClick={() => {
                      setSelected(people[0].id);
                      setShowAgent(true);
                    }}
                  >
                    Let’s find something lovely <ArrowUpRight size={17} />
                  </button>
                  <span className="hero-footnote">
                    <ShieldCheck size={13} />
                    Always within your rules. Always with a reason.
                  </span>
                </div>
                <div className="hero-visual">
                  <div className="orbital orbit-one" />
                  <div className="orbital orbit-two" />
                  <span className="floating-note note-one">
                    a little something, just for you.
                  </span>
                  <GiftArt />
                  <span className="floating-note note-two">
                    <Check size={12} />
                    Thoughtfully chosen
                  </span>
                  <span className="star star-one">✳</span>
                  <span className="star star-two">✧</span>
                </div>
              </section>
              <div className="stats">
                <div>
                  <span className="stat-icon">
                    <Users size={18} />
                  </span>
                  <div>
                    <span>Your people</span>
                    <strong>
                      {people.length}
                      <small>worth knowing well</small>
                    </strong>
                  </div>
                </div>
                <div>
                  <span className="stat-icon">
                    <CalendarDays size={18} />
                  </span>
                  <div>
                    <span>Upcoming moments</span>
                    <strong>
                      {
                        people.filter(
                          (p) =>
                            new Date(p.date) >=
                            new Date(new Date().toDateString()),
                        ).length
                      }
                      <small>something to look forward to</small>
                    </strong>
                  </div>
                </div>
                <button onClick={() => navigate("wallet")}>
                  <span className="stat-icon">
                    <WalletIcon size={18} />
                  </span>
                  <div>
                    <span>
                      Gifting balance <b className="tiny-badge">DEMO</b>
                    </span>
                    <strong>
                      {money(wallet.balance)}
                      <small>ready for a little joy</small>
                    </strong>
                  </div>
                  <ArrowUpRight size={16} />
                </button>
              </div>
            </>
          )}
          {["overview", "people", "occasions"].includes(view) && (
            <section className="people-section">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">
                    {view === "occasions"
                      ? "ON THE CALENDAR"
                      : "KEEP THEM CLOSE"}
                  </span>
                  <h2>
                    {view === "overview"
                      ? "Good people. Lovely occasions."
                      : view === "people"
                        ? "A small circle, a lot of meaning."
                        : "A reason to make them smile."}
                  </h2>
                </div>
                {view === "overview" && (
                  <button
                    className="text-button"
                    onClick={() => navigate("people")}
                  >
                    View all people <ArrowRight size={15} />
                  </button>
                )}
              </div>
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
                        onClick={() => setEditing({ ...p })}
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
                        : ["A story waiting to be told"]
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
                  <h3>Someone on your mind?</h3>
                  <p>Remember their little things.</p>
                  <b>
                    Add a person <ArrowUpRight size={13} />
                  </b>
                </button>
              </div>
            </section>
          )}
          {view === "overview" && (
            <section className="bottom-grid">
              <div className="thought-card">
                <span className="eyebrow">IT’S THE LITTLE THINGS</span>
                <h3>
                  A good gift says,
                  <br />
                  <em>“I’ve been listening.”</em>
                </h3>
                <p>
                  A favourite coffee. A passing comment. A class they’ve always
                  wanted to try. Start with a few notes. We’ll take it from
                  there.
                </p>
                <span className="line-flower">✳</span>
              </div>
              <div className="how-card">
                <div className="section-heading">
                  <h3>Thoughtful, from start to finish.</h3>
                  <ShieldCheck size={20} />
                </div>
                {[
                  [
                    "01",
                    "You share the little details",
                    "Interests, memories, things they already love.",
                  ],
                  [
                    "02",
                    "Your concierge connects the dots",
                    "A considered shortlist, with a reason for every choice.",
                  ],
                  [
                    "03",
                    "A little joy, within your rules",
                    "Automatic where allowed. Your approval where needed.",
                  ],
                ].map(([n, t, d]) => (
                  <div className="how-row" key={n}>
                    <span>{n}</span>
                    <div>
                      <h4>{t}</h4>
                      <p>{d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
          {view === "activity" && (
            <div className="activity-layout">
              <section>
                <div className="section-heading">
                  <h2>The gift ledger</h2>
                  <span className="muted">
                    {wallet.receipts.length} decisions
                  </span>
                </div>
                {wallet.receipts.length ? (
                  wallet.receipts.map(receiptView)
                ) : (
                  <div className="empty-state">
                    <History size={32} />
                    <h3>Your story starts with a gift.</h3>
                    <p>
                      Run your concierge for someone you care about. Every
                      decision will appear here.
                    </p>
                    <button
                      className="primary"
                      onClick={() => navigate("people")}
                    >
                      Meet your people <ArrowRight size={15} />
                    </button>
                  </div>
                )}
              </section>
              <section className="trace-panel">
                <span className="eyebrow">BEHIND THE THOUGHT</span>
                <h2>Agent notebook</h2>
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
                    YOUR GIFTING WALLET · SIMULATION
                  </span>
                  <h2>{money(wallet.balance)}</h2>
                  <p>Available for thoughtful little things.</p>
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
                    Mock funds only. No card connected. No real purchases.
                  </small>
                </section>
                <div className="wallet-note">
                  <ShieldCheck size={30} />
                  <h2>Every pound has a purpose.</h2>
                  <p>
                    Your balance is only reduced after a gift passes the
                    spending rules. Approval requests don’t deduct any funds.
                  </p>
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
                  {paid.length} completed mock purchases
                </span>
              </div>
              {wallet.receipts.length ? (
                wallet.receipts.map(receiptView)
              ) : (
                <div className="empty-state">
                  <Gift size={30} />
                  <h3>A fresh start. A world of possibilities.</h3>
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
                  <h2>A little freedom. Clear boundaries.</h2>
                  <p>Hard checks run in code before any mock money moves.</p>
                </div>
              </div>
              <div className="setting-row">
                <div>
                  <h3>Let stroy take care of it</h3>
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
            <span className="footer-brand">stroy ✳</span>
            <span>A little thought. A lasting feeling.</span>
            <span>Made for meaningful moments.</span>
          </footer>
        </main>
      </div>
      {showAgent && (
        <div className="overlay" onClick={() => !busy && setShowAgent(false)}>
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
                THE STROY CONCIERGE
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
              A little something
              <br />
              for <em>{current?.name.split(" ")[0]}.</em>
            </h2>
            <p className="muted">
              Thoughtful choices. Real AI. Simulated shopping.
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
            {busy && (
              <div className="thinking" role="status">
                <div className="thinking-orb">
                  <Sparkles size={27} />
                </div>
                <h3>
                  {
                    [
                      "Getting to know the little details…",
                      "Finding things they might love…",
                      "Considering the best fit…",
                      "Checking every spending rule…",
                    ][progress]
                  }
                </h3>
                <p>
                  Your concierge is working through the details. This usually
                  takes 15–40 seconds.
                </p>
                <div className="progress-dots">
                  {[0, 1, 2, 3].map((n) => (
                    <span key={n} className={n <= progress ? "lit" : ""} />
                  ))}
                </div>
              </div>
            )}
            {!busy && result && (
              <>
                <div className="agent-summary">
                  <Sparkles size={19} />
                  <p>{result.summary}</p>
                </div>
                <h3 className="drawer-section-title">
                  The little things we noticed
                </h3>
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
                <h3 className="drawer-section-title">
                  Chosen with them in mind
                </h3>
                <div className="recommendations">
                  {result.recommendations.map((r, i) => {
                    const p = catalog.find((p) => p.id === r.productId)!;
                    return (
                      <article className="product-card" key={r.productId}>
                        <GiftArt type={p.image} />
                        <div>
                          <span className="eyebrow">
                            {i === 0 ? "OUR FIRST THOUGHT" : "ALSO LOVELY"} ·
                            DEMO CATALOG
                          </span>
                          <h3>{p.name}</h3>
                          <span className="muted">{p.merchant}</span>
                          <p>{r.reason}</p>
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
                <GiftArt />
                <h3>A good gift starts with a little attention.</h3>
                <p>
                  I’ll read your notes, compare gifts from our demo studios, and
                  check your spending rules before buying anything.
                </p>
                <div>
                  <ShieldCheck size={15} />
                  No real money moves in this demo.
                </div>
              </div>
            )}
          </section>
        </div>
      )}
      {editing && (
        <div className="overlay modal-overlay" onClick={() => setEditing(null)}>
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
                onClick={() => setEditing(null)}
              >
                <X size={20} />
              </button>
            </div>
            <h2 id="profile-title">Tell us their little things.</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const p = {
                  ...editing,
                  dislikes: editing.dislikes
                    .map((x) => x.trim())
                    .filter(Boolean),
                  owned: editing.owned.map((x) => x.trim()).filter(Boolean),
                  interests: editing.interests
                    .map((x) => x.trim())
                    .filter(Boolean),
                  initials: editing.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase(),
                };
                setPeople((old) =>
                  old.some((x) => x.id === p.id)
                    ? old.map((x) => (x.id === p.id ? p : x))
                    : [...old, p],
                );
                setEditing(null);
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
                  Saved on this browser
                </span>
                <button className="primary" type="submit">
                  Save their story <ArrowRight size={15} />
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
              <span className="eyebrow">A LITTLE GUIDANCE</span>
              <button
                className="icon-button"
                aria-label="Close guidance"
                onClick={() => setHelp(false)}
              >
                <X size={20} />
              </button>
            </div>
            <h2>A thoughtful little demo.</h2>
            <p>
              Start with Alex or Sophie, or add someone of your own. Edit their
              notes, occasion, and budget, then choose “Find a gift.”
            </p>
            <p>
              Our OpenAI agent uses the Vercel AI SDK to explore eight fictional
              products, build an evidence-based shortlist, and attempt a mock
              purchase. The prices, merchants, delivery estimates, and £300
              wallet are all simulated.
            </p>
            <p>
              Under your automatic limit, the agent can purchase independently.
              Above it, you approve or decline. Every decision includes the
              evidence and spending rules.
            </p>
            <p>
              This demo saves people and agent notes in this browser, and wallet
              state in a signed cookie. It is not a real financial ledger.
              Clearing browser data starts a new demo. No live product search,
              email reminders, real orders, or Stripe connection is enabled.
            </p>
            <button className="primary" onClick={() => setHelp(false)}>
              Lovely, let’s begin <ArrowRight size={15} />
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
