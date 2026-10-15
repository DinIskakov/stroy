import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  ShieldCheck,
  Check,
  ChevronDown,
  Search,
} from "lucide-react";
import type { CSSProperties } from "react";

const gifts = [
  { id: "coffee", title: "For their slow mornings", size: 116 },
  { id: "flowers", title: "Just because", size: 88 },
  { id: "camera", title: "For the way they see things", size: 114 },
  { id: "cups", title: "A little everyday ritual", size: 142 },
  { id: "journal", title: "For all their little ideas", size: 106 },
  { id: "pottery", title: "Time together", size: 142 },
  { id: "candle", title: "A slower evening", size: 96 },
  { id: "grinder", title: "Something worth waking up for", size: 114 },
  { id: "headphones", title: "Their own little world", size: 100 },
  { id: "books", title: "One more chapter", size: 124 },
  { id: "vinyl", title: "The soundtrack to their Sunday", size: 105 },
  { id: "plant", title: "A little room to grow", size: 92 },
];

export default function Landing() {
  return (
    <div className="landing">
      <header className="landing-nav">
        <Link href="/" className="landing-wordmark" aria-label="stroy home">
          stroy<span>✳</span>
        </Link>
        <nav className="landing-links" aria-label="Explore stroy">
          <a href="#how-it-works">How it works</a>
          <a href="#research">The research</a>
          <a href="#your-rules">Your rules</a>
        </nav>
        <Link href="/app" className="landing-open">
          Open your space <ArrowUpRight size={16} />
        </Link>
      </header>
      <main className="landing-main">
        <section className="landing-hero" aria-labelledby="landing-title">
          <input
            type="checkbox"
            id="pause-orbit"
            className="orbit-toggle"
            aria-label="Pause gift animation"
          />
          <label htmlFor="pause-orbit" className="orbit-motion-label">
            <span /> Pause motion
          </label>
          <div className="photo-ring" aria-hidden="true">
            {gifts.map((gift, i) => (
              <div
                className="orbit-position"
                key={gift.id}
                style={
                  {
                    "--angle": `${i * (360 / gifts.length)}deg`,
                    "--tile-size": `${gift.size}px`,
                  } as CSSProperties
                }
              >
                <div className="orbit-counter">
                  <div className="orbit-photo">
                    <Image
                      src={`/images/${gift.id}.jpg`}
                      alt=""
                      fill
                      sizes="150px"
                      preload={i < 3}
                    />
                    <span>{gift.title}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="landing-copy">
            <span className="landing-kicker">
              <span /> YOUR PERSONAL GIFT AGENT
            </span>
            <h1 id="landing-title">
              Good gifts.
              <br />
              <span>More personal.</span>
            </h1>
            <p>
              You know your people. We find the gift.
              <br />A thoughtful agent, with your rules in mind.
            </p>
            <Link href="/app" className="landing-cta">
              Find something thoughtful <ArrowRight size={17} />
            </Link>
            <span className="landing-demo">
              <ShieldCheck size={13} /> Real research. Demo money.
            </span>
          </div>
          <div className="landing-bottom-note">
            <span>FOR THEIR NEXT CHAPTER.</span>
            <span>AND EVERY LITTLE MOMENT.</span>
          </div>
        </section>
        <section
          id="how-it-works"
          className="landing-how"
          aria-label="How stroy works"
        >
          <div>
            <span>01 / A PERSON</span>
            <h2>Start with someone.</h2>
            <p>
              Their interests, a passing comment, a thing they’ve always wanted
              to try.
            </p>
          </div>
          <div>
            <span>02 / A LITTLE RESEARCH</span>
            <h2>Find the thoughtful part.</h2>
            <p>
              Your agent researches ideas online and shows you where the
              inspiration came from.
            </p>
          </div>
          <div>
            <span>03 / YOUR RULES</span>
            <h2>Give with confidence.</h2>
            <p>
              Set a budget and approval limit. See what was chosen, why, and
              every policy check.
            </p>
          </div>
        </section>
        <section
          className="story-examples landing-section"
          aria-labelledby="examples-title"
        >
          <div className="landing-section-heading">
            <span className="section-kicker">
              THE DETAILS MAKE THE DIFFERENCE
            </span>
            <h2 id="examples-title">
              For your people.
              <br />
              <span>Not just any person.</span>
            </h2>
            <p>
              A good gift starts with something only you would know. Try the two
              profiles in your workspace, or add someone of your own.
            </p>
          </div>
          <div className="example-grid">
            <article className="example-card">
              <div className="example-photo">
                <Image
                  src="/images/coffee.jpg"
                  alt="Roasted specialty coffee beans"
                  fill
                  sizes="(max-width: 760px) 90vw, 550px"
                />
                <span>THE BEST FRIEND</span>
              </div>
              <div className="example-copy">
                <div className="example-person">
                  <span>AM</span>
                  <div>
                    <h3>Alex, your Sunday coffee person.</h3>
                    <p>Birthday · £65 budget</p>
                  </div>
                </div>
                <blockquote>
                  “He mentioned wanting to try beans from different origins.
                  Already has a grinder.”
                </blockquote>
                <p>
                  The starting point: a discovery set, with something new to
                  taste. The agent checks his notes, avoids equipment he owns,
                  and explains the choice.
                </p>
                <Link href="/app">
                  Find a gift for Alex <ArrowRight size={14} />
                </Link>
              </div>
            </article>
            <article className="example-card">
              <div className="example-photo">
                <Image
                  src="/images/pottery.jpg"
                  alt="Hands shaping clay at a pottery wheel"
                  fill
                  sizes="(max-width: 760px) 90vw, 550px"
                />
                <span>THE GIRLFRIEND</span>
              </div>
              <div className="example-copy">
                <div className="example-person">
                  <span>SC</span>
                  <div>
                    <h3>Sophie, a little time together.</h3>
                    <p>Anniversary · £120 budget</p>
                  </div>
                </div>
                <blockquote>
                  “She said she’d love to try a pottery class together. Prefers
                  experiences and handmade things.”
                </blockquote>
                <p>
                  The starting point: an afternoon at the wheel. At £88, this
                  demo gift fits her budget and asks for your approval above the
                  £50 automatic limit.
                </p>
                <Link href="/app">
                  Find a gift for Sophie <ArrowRight size={14} />
                </Link>
              </div>
            </article>
          </div>
        </section>
        <section
          id="research"
          className="research-story landing-section"
          aria-labelledby="research-title"
        >
          <div className="landing-section-heading">
            <span className="section-kicker">
              A LITTLE CURIOSITY GOES A LONG WAY
            </span>
            <h2 id="research-title">
              From a passing comment
              <br />
              to <span>something considered.</span>
            </h2>
            <p>
              stroy turns your notes into an interest profile, then looks for
              relevant trends and real gift ideas. You can follow the evidence
              behind every suggestion.
            </p>
            <div className="research-points">
              <p>
                <Check size={15} /> Your notes lead. Trends add inspiration.
              </p>
              <p>
                <Check size={15} /> Sources and search queries stay visible.
              </p>
              <p>
                <Check size={15} /> Inferred interests are labelled as guesses.
              </p>
            </div>
          </div>
          <div className="research-preview">
            <div className="preview-bar">
              <span />
              <span />
              <span />
              <small>A LOOK INSIDE THE AGENT</small>
            </div>
            <div className="research-preview-content">
              <span className="section-kicker">01 / UNDERSTAND</span>
              <blockquote>
                “Loves specialty coffee. Wants to try different origins.”
              </blockquote>
              <div className="preview-tags">
                <span>Specialty coffee</span>
                <span>New experiences</span>
                <span>Useful objects</span>
              </div>
              <span className="section-kicker">02 / EXPLORE</span>
              <div className="preview-search">
                <Search size={15} />
                <span>specialty coffee discovery gifts UK</span>
              </div>
              <p>
                Live Tavily research finds trends and gift ideas from the web,
                with links you can explore.
              </p>
              <span className="section-kicker">03 / EXPLAIN</span>
              <div className="preview-conclusion">
                <ShieldCheck size={20} />
                <p>
                  “A new coffee experience, without buying another grinder.”
                  <small>
                    Illustrative decision · actual recommendations vary
                  </small>
                </p>
              </div>
            </div>
            <div className="preview-footnote">
              Live web finds are research only. Demo purchases use our
              eight-item catalog. Local runs use the catalog without web search.
            </div>
          </div>
        </section>
        <section
          id="your-rules"
          className="rules-story landing-section"
          aria-labelledby="rules-title"
        >
          <div className="landing-section-heading">
            <span className="section-kicker">
              A THOUGHTFUL AGENT. CLEAR BOUNDARIES.
            </span>
            <h2 id="rules-title">
              A little freedom.
              <br />
              <span>Your rules, always.</span>
            </h2>
            <p>
              Give your agent room to choose, with a clear explanation of every
              pound. These checks run in code before your demo balance changes.
            </p>
            <Link href="/app" className="text-button">
              Set your spending rules <ArrowRight size={15} />
            </Link>
          </div>
          <div className="policy-preview">
            <div className="policy-preview-heading">
              <ShieldCheck size={19} />
              <span>YOUR DEFAULT SPENDING POLICY</span>
            </div>
            <dl>
              <div>
                <dt>Demo balance</dt>
                <dd>£300</dd>
              </div>
              <div>
                <dt>Automatic purchase limit</dt>
                <dd>Up to £50</dd>
              </div>
              <div>
                <dt>Above your limit</dt>
                <dd>Your approval</dd>
              </div>
              <div>
                <dt>Recipient budget</dt>
                <dd>Includes delivery</dd>
              </div>
              <div>
                <dt>Allowed merchants</dt>
                <dd>Approved demo studios</dd>
              </div>
            </dl>
            <div className="policy-checks">
              <span>
                <Check size={12} /> Enough funds
              </span>
              <span>
                <Check size={12} /> Arrives in time
              </span>
              <span>
                <Check size={12} /> Avoids dislikes
              </span>
              <span>
                <Check size={12} /> No duplicate gift
              </span>
            </div>
            <p>
              Every purchase includes the choice, its evidence, and the rules it
              passed. All payments in this demo are simulated.
            </p>
          </div>
        </section>
        <section
          className="landing-faq landing-section"
          aria-labelledby="faq-title"
        >
          <div className="landing-section-heading">
            <span className="section-kicker">A FEW LITTLE ANSWERS</span>
            <h2 id="faq-title">Before you begin.</h2>
          </div>
          <div className="faq-list">
            {[
              [
                "Does stroy spend real money?",
                "No. This version starts with a £300 mock balance. Purchases and approval flows are simulated; no payment card is connected and no real orders are placed.",
              ],
              [
                "What does the agent search online?",
                "In production, Tavily searches generic interests, gift trends, and possible products. It does not search for your person’s identity. Each research result includes its source. When running locally, web search is disabled and the agent uses the demo catalog.",
              ],
              [
                "Can I change the suggested interests?",
                "Yes. Edit the person’s notes, interests, dislikes, things they already own, occasion, and budget, then run the agent again. Inferred interests are shown separately from what you told us.",
              ],
              [
                "What if a gift breaks one of my rules?",
                "The purchase is blocked if it exceeds the recipient’s total budget, lacks sufficient funds, uses an unapproved merchant, or fails another required check. Gifts above your automatic limit need approval before the mock balance changes.",
              ],
              [
                "Where is my information saved?",
                "Profiles and results are saved in your browser, with the demo wallet in a signed cookie. When Cognee is configured, profile updates and preferences can also be remembered by the agent. Use fictional notes for this demo.",
              ],
            ].map(([question, answer]) => (
              <details key={question}>
                <summary>
                  {question}
                  <ChevronDown size={15} />
                </summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </section>
        <section className="landing-final">
          <span className="section-kicker">THEY’RE ALREADY ON YOUR MIND.</span>
          <h2>
            Let’s find their
            <br />
            <span>next little favourite.</span>
          </h2>
          <p>Start with a person. Leave the searching to stroy.</p>
          <Link href="/app" className="landing-cta">
            Find something thoughtful <ArrowRight size={17} />
          </Link>
          <small>
            Two demo profiles. A £300 demo balance. A little more thought.
          </small>
        </section>
      </main>
      <footer className="landing-footer">
        <span>stroy ✳</span>
        <span>Made for the people who matter.</span>
        <span>Demo experience · simulated purchases</span>
      </footer>
    </div>
  );
}
