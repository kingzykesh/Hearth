"use client";

import { useEffect, useState } from "react";
import { Download, Loader2, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import api from "@/app/lib/api";

type Screening = {
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
    rule_score?: number | null;
    processing_status: string;
  } | null;
};

type PaginatedScreenings = {
  data: Screening[];
  current_page: number;
  last_page: number;
};

export default function AdminScreeningsPage() {
  const [screenings, setScreenings] = useState<PaginatedScreenings | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  const fetchScreenings = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/admin/screenings");
      setScreenings(response.data.data);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Unable to load screenings."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScreenings();
  }, []);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    return new Intl.DateTimeFormat("en-NG", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(dateString));
  };

  const handleReprocess = async (id: number) => {
    try {
      setBusyId(id);
      const response = await api.post(`/api/admin/screenings/${id}/reprocess`);
      toast.success(response.data.message || "Screening reprocessed.");
      fetchScreenings();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Reprocessing failed.");
    } finally {
      setBusyId(null);
    }
  };

  const handleExport = () => {
    window.open("http://localhost:8080/api/admin/screenings/export", "_blank");
  };

  return (
    <section className="space-y-6">
      <div className="rounded-[28px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Screenings</h2>
            <p className="mt-2 text-sm opacity-70">
              View all uploaded screenings, reprocess ML, and export records.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={fetchScreenings}
              className="inline-flex items-center gap-2 rounded-2xl border border-[var(--border)] px-4 py-3 text-sm font-medium transition hover:bg-[var(--muted)]"
            >
              <RefreshCcw size={16} />
              Refresh
            </button>

            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center gap-2 rounded-2xl bg-[var(--primary)] px-4 py-3 text-sm font-medium text-[var(--primary-foreground)]"
            >
              <Download size={16} />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="inline-flex items-center gap-3 rounded-2xl border border-[var(--border)] px-5 py-3">
              <Loader2 className="animate-spin" size={18} />
              <span>Loading screenings...</span>
            </div>
          </div>
        ) : !screenings?.data?.length ? (
          <div className="py-16 text-center text-sm opacity-70">
            No screenings found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-[var(--border)]">
                <tr>
                  <th className="px-3 py-3">User</th>
                  <th className="px-3 py-3">File</th>
                  <th className="px-3 py-3">Risk</th>
                  <th className="px-3 py-3">Confidence</th>
                  <th className="px-3 py-3">Rule Score</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Uploaded</th>
                  <th className="px-3 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {screenings.data.map((screening) => (
                  <tr
                    key={screening.id}
                    className="border-b border-[var(--border)]/50"
                  >
                    <td className="px-3 py-4">
                      <div>{screening.user?.name || "—"}</div>
                      <div className="text-xs opacity-60">
                        {screening.user?.email || ""}
                      </div>
                    </td>
                    <td className="px-3 py-4">{screening.original_filename}</td>
                    <td className="px-3 py-4">
                      {screening.prediction?.risk_level || "—"}
                    </td>
                    <td className="px-3 py-4">
                      {screening.prediction?.confidence_score
                        ? `${screening.prediction.confidence_score}%`
                        : "—"}
                    </td>
                    <td className="px-3 py-4">
                      {screening.prediction?.rule_score ?? "—"}
                    </td>
                    <td className="px-3 py-4">
                      {screening.prediction?.processing_status ||
                        screening.processing_status}
                    </td>
                    <td className="px-3 py-4">
                      {formatDate(screening.uploaded_at || screening.created_at)}
                    </td>
                    <td className="px-3 py-4">
                      <button
                        type="button"
                        disabled={busyId === screening.id}
                        onClick={() => handleReprocess(screening.id)}
                        className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-3 py-2 text-xs font-medium transition hover:bg-[var(--muted)]"
                      >
                        {busyId === screening.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <RefreshCcw size={14} />
                        )}
                        Reprocess
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}