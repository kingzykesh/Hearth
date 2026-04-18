export default function ProfilePage() {
  return (
    <section className="space-y-6">
      <div className="rounded-[28px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <h2 className="text-2xl font-semibold">Profile</h2>
        <p className="mt-3 text-sm leading-7 opacity-75">
          Your personal details, account preferences, and profile settings will
          be managed here.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-[28px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
          <h3 className="text-lg font-semibold">Personal Information</h3>
          <p className="mt-3 text-sm opacity-70">
            Editable profile fields will be added here.
          </p>
        </div>

        <div className="rounded-[28px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
          <h3 className="text-lg font-semibold">Security</h3>
          <p className="mt-3 text-sm opacity-70">
            Password update and account actions will be added here.
          </p>
        </div>
      </div>
    </section>
  );
}