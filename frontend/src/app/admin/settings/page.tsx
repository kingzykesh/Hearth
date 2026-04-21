export default function AdminSettingsPage() {
  return (
    <section className="space-y-6">
      <div className="rounded-[28px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <h2 className="text-2xl font-semibold">Admin Settings</h2>
        <p className="mt-2 text-sm opacity-70">
          Platform configuration and advanced admin controls will live here.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-[28px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
          <h3 className="text-lg font-semibold">System Preferences</h3>
          <p className="mt-3 text-sm opacity-70">
            Settings for model configuration, thresholds, and admin policies
            can be added here.
          </p>
        </div>

        <div className="rounded-[28px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
          <h3 className="text-lg font-semibold">Security Controls</h3>
          <p className="mt-3 text-sm opacity-70">
            Additional access rules, audit settings, and admin management can
            be added here.
          </p>
        </div>
      </div>
    </section>
  );
}