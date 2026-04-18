"use client";

import ThemeToggle from "@/app/components/shared/theme-toggle";

type DashboardHeaderProps = {
  userName?: string;
  userEmail?: string;
};

export default function DashboardHeader({
  userName,
  userEmail,
}: DashboardHeaderProps) {
  return (
    <header className="flex flex-col gap-4 rounded-[28px] border border-[var(--border)] bg-[var(--card)]/95 p-5 shadow-lg backdrop-blur md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-sm opacity-70">Welcome back</p>
        <h1 className="text-2xl font-bold md:text-3xl">{userName || "User"}</h1>
        <p className="mt-1 text-sm opacity-70">{userEmail || "No email available"}</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--muted)] px-4 py-3 text-sm font-medium">
          AI Voice Screening
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}
