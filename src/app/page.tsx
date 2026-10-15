import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, ShieldCheck } from "lucide-react";
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
];

export default function Landing() {
  return (
    <div className="landing">
      <header className="landing-nav">
        <Link href="/" className="landing-wordmark" aria-label="stroy home">
          stroy<span>↗</span>
        </Link>
        <span className="landing-nav-caption">A little more thoughtful.</span>
        <Link href="/app" className="landing-open">
          Open your space <ArrowUpRight size={16} />
        </Link>
      </header>
      <main className="landing-main">
        <section className="landing-hero" aria-labelledby="landing-title">
          <div className="photo-ring" aria-hidden="true">
            {gifts.map((gift, i) => (
              <div
                className="orbit-position"
                key={gift.id}
                style={
                  {
                    "--angle": `${i * 45}deg`,
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
        <section className="landing-how" aria-label="How stroy works">
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
      </main>
      <footer className="landing-footer">
        <span>stroy ↗</span>
        <span>Made for the people who matter.</span>
        <span>Demo experience · simulated purchases</span>
      </footer>
    </div>
  );
}
