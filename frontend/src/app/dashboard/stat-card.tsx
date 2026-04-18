type StatCardProps = {
  label: string;
  value: string;
  hint?: string;
};

export default function StatCard({ label, value, hint }: StatCardProps) {
  return (
    <div className="rounded-[28px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
      <p className="text-sm opacity-70">{label}</p>
      <h2 className="mt-3 text-3xl font-bold">{value}</h2>
      {hint ? <p className="mt-3 text-sm opacity-60">{hint}</p> : null}
    </div>
  );
}