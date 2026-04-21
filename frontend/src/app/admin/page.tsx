"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/app/lib/api";
import AdminStatCard from "../components/admin/admin-stat-card";

type AdminSummaryResponse = {
  totals: {
    users: number;
    screenings: number;
    predictions: number;
    completed_predictions: number;
    failed_predictions: number;
  };
  risk_distribution: {
    low_risk: number;
    high_risk: number;
  };
  recent_users: {
    id: number;
    name: string;
    email: string;
    email_verified_at: string | null;
    created_at: string;
  }[];
  recent_screenings: {
    id: number;
    original_filename: string;
    processing_status: string;
    uploaded_at: string | null;
    created_at: string;
    user?: {
      name: string;
      email: string;
    };
    prediction?: {
      risk_level: string | null;
      confidence_score: string | number | null;
      processing_status: string;
    } | null;
  }[];
};

export default function AdminOverviewPage() {
  const [summary, setSummary] = useState<AdminSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await api.get("/api/admin/summary");
        setSummary(response.data.data);
      } catch (error: any) {
        toast.error(
          error?.response?.data?.message || "Unable to load admin summary."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-NG", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  };

  if (loading) {
    return (
      <section className="flex min-h-[40vh] items-center justify-center">
        <div className="inline-flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-5 py-3">
          <Loader2 className="animate-spin" size={18} />
          <span>Loading admin analytics...</span>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-5">
        <AdminStatCard
          label="Total Users"
          value={summary?.totals.users ?? 0}
          hint="All registered accounts."
        />
        <AdminStatCard
          label="Total Screenings"
          value={summary?.totals.screenings ?? 0}
          hint="All uploaded voice samples."
        />
        <AdminStatCard
          label="Predictions"
          value={summary?.totals.predictions ?? 0}
          hint="All created prediction records."
        />
        <AdminStatCard
          label="Completed"
          value={summary?.totals.completed_predictions ?? 0}
          hint="Successfully processed predictions."
        />
        <AdminStatCard
          label="Failed"
          value={summary?.totals.failed_predictions ?? 0}
          hint="Predictions that failed."
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-[28px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Risk Distribution</h2>
          <div className="mt-5 space-y-4">
            <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-4">
              <p className="text-sm opacity-70">Low Risk</p>
              <h3 className="mt-2 text-3xl font-bold">
                {summary?.risk_distribution.low_risk ?? 0}
              </h3>
            </div>

            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
              <p className="text-sm opacity-70">High Risk</p>
              <h3 className="mt-2 text-3xl font-bold">
                {summary?.risk_distribution.high_risk ?? 0}
              </h3>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm xl:col-span-2">
          <h2 className="text-xl font-semibold">Recent Users</h2>
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-[var(--border)]">
                <tr>
                  <th className="px-2 py-3">Name</th>
                  <th className="px-2 py-3">Email</th>
                  <th className="px-2 py-3">Verified</th>
                  <th className="px-2 py-3">Joined</th>
                </tr>
              </thead>
              <tbody>
                {summary?.recent_users.map((user) => (
                  <tr key={user.id} className="border-b border-[var(--border)]/50">
                    <td className="px-2 py-4">{user.name}</td>
                    <td className="px-2 py-4">{user.email}</td>
                    <td className="px-2 py-4">
                      {user.email_verified_at ? "Yes" : "No"}
                    </td>
                    <td className="px-2 py-4">{formatDate(user.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Recent Screenings</h2>
        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[var(--border)]">
              <tr>
                <th className="px-2 py-3">User</th>
                <th className="px-2 py-3">File</th>
                <th className="px-2 py-3">Risk</th>
                <th className="px-2 py-3">Confidence</th>
                <th className="px-2 py-3">Status</th>
                <th className="px-2 py-3">Uploaded</th>
              </tr>
            </thead>
            <tbody>
              {summary?.recent_screenings.map((screening) => (
                <tr
                  key={screening.id}
                  className="border-b border-[var(--border)]/50"
                >
                  <td className="px-2 py-4">
                    <div>{screening.user?.name || "—"}</div>
                    <div className="text-xs opacity-60">
                      {screening.user?.email || ""}
                    </div>
                  </td>
                  <td className="px-2 py-4">{screening.original_filename}</td>
                  <td className="px-2 py-4">
                    {screening.prediction?.risk_level || "—"}
                  </td>
                  <td className="px-2 py-4">
                    {screening.prediction?.confidence_score
                      ? `${screening.prediction.confidence_score}%`
                      : "—"}
                  </td>
                  <td className="px-2 py-4">
                    {screening.prediction?.processing_status ||
                      screening.processing_status}
                  </td>
                  <td className="px-2 py-4">
                    {formatDate(screening.uploaded_at || screening.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}