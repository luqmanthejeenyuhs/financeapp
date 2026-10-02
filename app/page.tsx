import Link from "next/link";
import TickerTape from "@/components/marketing/TickerTape";
import MobileNav from "@/components/marketing/MobileNav";

const CAPABILITIES = [
  {
    label: "Execution",
    title: "Algorithmic order routing",
    body: "Orders are placed directly against your connected OANDA account. No dealing desk, no re-quotes — every fill is timestamped and visible in your trade log.",
  },
  {
    label: "Automation",
    title: "Configurable strategy bot",
    body: "Turn on a rules-based strategy (moving-average crossover to start), set your own risk-per-trade, and the bot manages entries and exits inside your risk limits.",
  },
  {
    label: "Custody",
    title: "Segregated client funds",
    body: "Deposits are held in a client account separate from company operating funds, released on withdrawal request per our terms.",
  },
  {
    label: "Reporting",
    title: "Full statement history",
    body: "Every trade, deposit, and withdrawal is logged and exportable. Your equity curve reflects your actual account, not a projection.",
  },
];

const STEPS = [
  { n: "01", title: "Apply", body: "Create an account and complete identity verification (KYC) — required before any funds move." },
  { n: "02", title: "Fund", body: "Deposit to your segregated client account once verification clears." },
  { n: "03", title: "Configure", body: "Set your risk parameters and switch the bot on, or trade manually — your choice." },
  { n: "04", title: "Withdraw", body: "Request a withdrawal any time; funds are released per our processing terms." },
];

export default function LandingPage() {
  return (
    <main>
      <header className="sticky top-0 z-30 bg-ink/90 backdrop-blur">
        <nav className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <span className="font-display text-lg font-medium tracking-tight">
            Kestrel<span className="text-brass">Capital</span>FX
          </span>
          <div className="hidden items-center gap-8 text-sm text-muted md:flex">
            <a href="#capabilities" className="hover:text-paper">Capabilities</a>
            <a href="#how-it-works" className="hover:text-paper">How it works</a>
            <a href="#risk" className="hover:text-paper">Risk disclosure</a>
          </div>
          <div className="hidden items-center gap-3 md:flex">
            <Link href="/login" className="text-sm text-muted hover:text-paper">Log in</Link>
            <Link
              href="/register"
              className="rounded-sm bg-brass px-4 py-2 text-sm font-medium text-ink transition hover:bg-brass-bright"
            >
              Open an account
            </Link>
          </div>
          <MobileNav />
        </nav>
        <TickerTape />
      </header>

      {/* Hero: split — thesis statement left, instrument-panel readout right */}
      <section className="mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-2 md:py-28">
        <div className="flex flex-col justify-center">
          <span className="mb-5 font-mono text-xs uppercase tracking-widest2 text-brass">
            Regulated execution · Client-owned accounts
          </span>
          <h1 className="font-display text-4xl font-medium leading-[1.08] tracking-tight md:text-5xl">
            Your capital.
            <br />
            Our execution engine.
          </h1>
          <p className="mt-6 max-w-md text-muted">
            Kestrel Capital FX connects your own brokerage account to a
            rules-based trading bot and a transparent reporting layer — you
            keep custody of your account credentials and trade history at all
            times.
          </p>
          <div className="mt-8 flex items-center gap-4">
            <Link
              href="/register"
              className="rounded-sm bg-brass px-6 py-3 text-sm font-medium text-ink transition hover:bg-brass-bright"
            >
              Open an account
            </Link>
            <a href="#how-it-works" className="text-sm text-muted hover:text-paper">
              See how it works →
            </a>
          </div>
          <p className="mt-10 max-w-md text-xs leading-relaxed text-faint">
            Trading forex carries a high level of risk and may not be
            suitable for all investors. Past performance is not indicative
            of future results.
          </p>
        </div>

        <InstrumentPanel />
      </section>

      {/* Capabilities — parallel items, not a sequence, so no numbering */}
      <section id="capabilities" className="border-t rule">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <span className="font-mono text-xs uppercase tracking-widest2 text-brass">Capabilities</span>
          <h2 className="mt-3 max-w-lg font-display text-3xl font-medium tracking-tight">
            Built around a real account, not a simulated one.
          </h2>
          <div className="mt-12 grid gap-px overflow-hidden rounded-sm border rule bg-line md:grid-cols-2">
            {CAPABILITIES.map((c) => (
              <div key={c.title} className="bg-ink p-8">
                <span className="font-mono text-xs uppercase tracking-widest2 text-faint">{c.label}</span>
                <h3 className="mt-3 font-display text-xl font-medium">{c.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works — a real sequence, numbering earns its place here */}
      <section id="how-it-works" className="border-t rule">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <span className="font-mono text-xs uppercase tracking-widest2 text-brass">Onboarding</span>
          <h2 className="mt-3 max-w-lg font-display text-3xl font-medium tracking-tight">
            Four steps, in this order.
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-4">
            {STEPS.map((s) => (
              <div key={s.n} className="border-t-2 border-brass pt-4">
                <span className="font-mono text-xs text-faint">{s.n}</span>
                <h3 className="mt-2 font-display text-lg font-medium">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Risk disclosure — a legitimate forex brokerage shows this prominently, not buried */}
      <section id="risk" className="border-t rule bg-panel/40">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <span className="font-mono text-xs uppercase tracking-widest2 text-brass">Risk disclosure</span>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted">
            Foreign exchange trading involves substantial risk of loss and is
            not suitable for every investor. The valuation of currencies may
            fluctuate, and, as a result, clients may lose more than their
            original investment. Automated strategies do not guarantee
            profit and can produce losses in adverse market conditions.
            Before deciding to trade, you should carefully consider your
            investment objectives, level of experience, and risk appetite.
            [Add your firm&rsquo;s regulatory registration number(s) and
            jurisdiction here once licensing is confirmed.]
          </p>
        </div>
      </section>

      <footer className="border-t rule">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-6 py-12 md:flex-row md:items-center">
          <span className="font-display text-sm text-muted">
            Kestrel<span className="text-brass">Capital</span>FX
          </span>
          <p className="max-w-md text-xs text-faint">
            © {new Date().getFullYear()} Kestrel Capital FX. Not yet licensed
            in any jurisdiction — replace this line once registration is
            complete. Demo build.
          </p>
        </div>
      </footer>
    </main>
  );
}

/** The hero's right-hand instrument-panel readout — an illustrative equity
 * line + open-position strip, echoing what a client sees post-login. */
function InstrumentPanel() {
  const points = [12, 18, 15, 22, 19, 26, 24, 31, 28, 36, 33, 41];
  const max = Math.max(...points);
  const min = Math.min(...points);
  const w = 320;
  const h = 120;
  const step = w / (points.length - 1);
  const path = points
    .map((p, i) => {
      const x = i * step;
      const y = h - ((p - min) / (max - min)) * h;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <div className="flex items-center">
      <div className="w-full rounded-sm border rule bg-panel p-6 shadow-panel">
        <div className="flex items-center justify-between font-mono text-xs text-faint">
          <span>ACCOUNT EQUITY — ILLUSTRATIVE</span>
          <span className="text-rise">+18.4%</span>
        </div>
        <svg viewBox={`0 0 ${w} ${h}`} className="mt-4 w-full" preserveAspectRatio="none">
          <path d={path} fill="none" stroke="#C9A24B" strokeWidth="2" />
        </svg>
        <div className="mt-6 grid grid-cols-3 gap-4 border-t rule pt-4 font-mono text-xs">
          <div>
            <div className="text-faint">Open positions</div>
            <div className="mt-1 font-tabular text-paper">3</div>
          </div>
          <div>
            <div className="text-faint">Bot status</div>
            <div className="mt-1 text-rise">Active</div>
          </div>
          <div>
            <div className="text-faint">Risk per trade</div>
            <div className="mt-1 font-tabular text-paper">1.0%</div>
          </div>
        </div>
      </div>
    </div>
  );
}
