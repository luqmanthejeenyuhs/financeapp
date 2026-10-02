export default function StatCard({
  label,
  value,
  tone = "default",
  hint,
}: {
  label: string;
  value: string;
  tone?: "default" | "rise" | "fall";
  hint?: string;
}) {
  const toneClass = tone === "rise" ? "text-rise" : tone === "fall" ? "text-fall" : "text-paper";

  return (
    <div className="rounded-sm border rule bg-panel p-5">
      <div className="font-mono text-xs uppercase tracking-widest2 text-faint">{label}</div>
      <div className={`mt-2 font-mono text-2xl font-medium font-tabular ${toneClass}`}>{value}</div>
      {hint && <div className="mt-1 text-xs text-faint">{hint}</div>}
    </div>
  );
}
