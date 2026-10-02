const INSTRUMENTS: { pair: string; price: string; change: string; dir: "up" | "down" }[] = [
  { pair: "EUR/USD", price: "1.0842", change: "+0.12%", dir: "up" },
  { pair: "GBP/USD", price: "1.2691", change: "-0.08%", dir: "down" },
  { pair: "USD/JPY", price: "156.34", change: "+0.31%", dir: "up" },
  { pair: "XAU/USD", price: "2418.60", change: "+0.44%", dir: "up" },
  { pair: "USD/CHF", price: "0.8981", change: "-0.05%", dir: "down" },
  { pair: "AUD/USD", price: "0.6659", change: "+0.09%", dir: "up" },
  { pair: "USD/CAD", price: "1.3702", change: "-0.14%", dir: "down" },
  { pair: "NZD/USD", price: "0.6098", change: "+0.06%", dir: "up" },
];

/**
 * A static illustrative ticker for marketing surfaces (not live data — the
 * real, licensed feed only appears once a client is authenticated and
 * inside /dashboard, via /api/oanda/*).
 */
export default function TickerTape() {
  const row = (keyPrefix: string) => (
    <div className="flex shrink-0 items-center gap-8 pr-8">
      {INSTRUMENTS.map((i) => (
        <div key={`${keyPrefix}-${i.pair}`} className="flex items-center gap-2 font-mono text-xs">
          <span className="text-faint">{i.pair}</span>
          <span className="font-tabular text-paper">{i.price}</span>
          <span className={i.dir === "up" ? "text-rise" : "text-fall"}>{i.change}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="overflow-hidden border-y rule bg-panel/60">
      <div className="ticker-track flex w-max">
        {row("a")}
        {row("b")}
      </div>
    </div>
  );
}
