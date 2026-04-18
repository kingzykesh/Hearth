import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <section className="mx-auto flex min-h-screen max-w-7xl flex-col items-center justify-center px-6 text-center">
        <div className="mb-6 inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--muted)] px-4 py-2 text-sm">
          Hearth • AI Voice Screening Platform
        </div>

        <h1 className="max-w-4xl text-4xl font-bold leading-tight md:text-6xl">
          A sleek AI-enabled platform for preliminary vocal instability screening.
        </h1>

        <p className="mt-6 max-w-2xl text-base md:text-lg opacity-80">
          Record a short voice sample, process signal features, and receive an
          interpretable screening result with clarity and confidence.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/register"
            className="rounded-2xl bg-[var(--primary)] px-6 py-3 font-semibold text-[var(--primary-foreground)] transition hover:scale-[1.02]"
          >
            Get Started
          </Link>

          <Link
            href="/login"
            className="rounded-2xl border border-[var(--border)] px-6 py-3 font-semibold transition hover:bg-[var(--muted)]"
          >
            Sign In
          </Link>
        </div>
      </section>
    </main>
  );
}