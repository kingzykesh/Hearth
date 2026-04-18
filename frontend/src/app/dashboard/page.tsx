"use client";

import { useEffect, useState } from "react";
import { Loader2, ShieldCheck, ActivitySquare, BrainCircuit } from "lucide-react";
import { toast } from "sonner";
import api from "@/app/lib/api";
import StatCard from "../components/dashboard/stat-card";

type DashboardSummary = {
  user_name: string;
  total_screenings: number;
  last_screening_date: string | null;
  last_result: string | null;
  last_confidence: string | number | null;
  last_summary: string | null;
  last_status: string | null;
  last_model_used: string | null;
  email_verified: boolean;
};

export default function DashboardOverviewPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardSummary = async () => {
      try {
        const response = await api.get("/api/dashboard-summary");
        setSummary(response.data.data);
      } catch (error: any) {
        toast.error(
          error?.response?.data?.message || "Unable to load dashboard summary."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardSummary();
  }, []);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-NG", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  };

  const getStatusBadgeClasses = (status: string | null | undefined) => {
    if (!status) {
      return "border-[var(--border)] bg-[var(--muted)] text-[var(--foreground)]";
    }

    const normalized = status.toLowerCase();

    if (normalized === "completed" || normalized === "processed") {
      return "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400";
    }

    if (normalized === "failed") {
      return "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400";
    }

    return "border-yellow-500/30 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400";
  };

  const getRiskBadgeClasses = (risk: string | null | undefined) => {
    if (!risk) {
      return "border-[var(--border)] bg-[var(--muted)] text-[var(--foreground)]";
    }

    if (risk.toLowerCase().includes("high")) {
      return "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400";
    }

    return "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400";
  };

  if (loading) {
    return (
      <section className="flex min-h-[50vh] items-center justify-center">
        <div className="inline-flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-5 py-3">
          <Loader2 className="animate-spin" size={18} />
          <span>Loading overview...</span>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Screenings"
          value={String(summary?.total_screenings ?? 0)}
          hint="All uploaded and processed voice screenings."
        />
        <StatCard
          label="Latest Risk Result"
          value={summary?.last_result || "—"}
          hint="Most recent screening classification."
        />
        <StatCard
          label="Latest Confidence"
          value={
            summary?.last_confidence
              ? `${summary.last_confidence}%`
              : "—"
          }
          hint="Confidence score from the latest screening."
        />
        <StatCard
          label="Last Screening Date"
          value={formatDate(summary?.last_screening_date ?? null)}
          hint="Timestamp of your most recent screening."
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <div className="rounded-[28px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <BrainCircuit className="text-[var(--primary)]" size={22} />
            <h2 className="text-xl font-semibold">Latest Screening Summary</h2>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span
              className={`rounded-full border px-3 py-1 text-xs font-medium ${getRiskBadgeClasses(
                summary?.last_result
              )}`}
            >
              Risk: {summary?.last_result || "Not available"}
            </span>

            <span
              className={`rounded-full border px-3 py-1 text-xs font-medium ${getStatusBadgeClasses(
                summary?.last_status
              )}`}
            >
              Status: {summary?.last_status || "No status"}
            </span>

            <span className="rounded-full border border-[var(--border)] bg-[var(--muted)] px-3 py-1 text-xs font-medium">
              Model: {summary?.last_model_used || "—"}
            </span>
          </div>

          <p className="mt-5 text-sm leading-7 opacity-80">
            {summary?.last_summary ||
              "Your most recent screening summary will appear here after a voice sample has been processed."}
          </p>
        </div>

        <div className="space-y-6">
          <div className="rounded-[28px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <ShieldCheck className="text-[var(--primary)]" size={22} />
              <h2 className="text-lg font-semibold">Account Status</h2>
            </div>

            <div className="mt-5 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="opacity-70">Email Verification</span>
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-medium ${
                    summary?.email_verified
                      ? "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400"
                      : "border-yellow-500/30 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
                  }`}
                >
                  {summary?.email_verified ? "Verified" : "Pending"}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="opacity-70">Latest Processing Status</span>
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-medium ${getStatusBadgeClasses(
                    summary?.last_status
                  )}`}
                >
                  {summary?.last_status || "No screening yet"}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <ActivitySquare className="text-[var(--primary)]" size={22} />
              <h2 className="text-lg font-semibold">Screening Insight</h2>
            </div>

            <p className="mt-4 text-sm leading-7 opacity-80">
              {summary?.last_result
                ? `Your latest screening returned a ${summary.last_result} profile with a confidence score of ${
                    summary.last_confidence ? `${summary.last_confidence}%` : "—"
                  }.`
                : "Record and upload your first voice sample to begin seeing live screening insights here."}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}