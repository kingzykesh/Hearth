"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function VerifiedPage() {
  const searchParams = useSearchParams();
  const verified = searchParams.get("verified");
  const message = searchParams.get("message");

  const isSuccess = verified === "1";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-6 text-[var(--foreground)]">
      <div className="w-full max-w-lg rounded-3xl border border-[var(--border)] bg-[var(--card)] p-8 text-center shadow-sm">
        <h1 className="text-3xl font-bold">
          {isSuccess ? "Email verified" : "Verification failed"}
        </h1>

        <p className="mt-4 opacity-75">
          {isSuccess
            ? "Your email has been verified successfully. You can now sign in to Hearth."
            : message === "invalid-link"
            ? "This verification link is invalid or has expired."
            : message === "invalid-hash"
            ? "This verification link does not match your account."
            : "We could not verify your email address."}
        </p>

        <div className="mt-8">
          <Link
            href="/login"
            className="inline-flex rounded-2xl bg-[var(--primary)] px-6 py-3 font-semibold text-[var(--primary-foreground)] transition hover:scale-[1.01]"
          >
            Go to Login
          </Link>
        </div>
      </div>
    </main>
  );
}