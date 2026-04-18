"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCw, FileAudio } from "lucide-react";
import { toast } from "sonner";
import api from "@/app/lib/api";

type Prediction = {
  risk_level: string | null;
  confidence_score: string | number | null;
  summary: string | null;
  model_used: string | null;
  processing_status: string;
  error_message?: string | null;
} | null;

type VoiceSample = {
  id: number;
  original_filename: string;
  stored_filename: string;
  file_path: string;
  mime_type: string | null;
  file_size: number | null;
  duration_seconds: string | number | null;
  processing_status: string;
  uploaded_at: string | null;
  created_at: string;
  prediction?: Prediction;
};

export default function ScreeningHistoryPage() {
  const [samples, setSamples] = useState<VoiceSample[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSamples = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await api.get("/api/voice-samples");
      setSamples(response.data.data || []);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Unable to load screening history."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSamples();
  }, []);

  const totalUploads = useMemo(() => samples.length, [samples]);

  const latestPrediction = useMemo(() => {
    return samples.find((sample) => sample.prediction)?.prediction || null;
  }, [samples]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-NG", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  };

  const formatFileSize = (size: number | null) => {
    if (!size) return "—";
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getRiskBadgeClasses = (riskLevel: string | null | undefined) => {
    if (!riskLevel) {
      return "border-[var(--border)] bg-[var(--muted)] text-[var(--foreground)]";
    }

    if (riskLevel.toLowerCase().includes("high")) {
      return "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400";
    }

    return "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400";
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

  return (
    <section className="space-y-6">
      <div className="rounded-[28px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Screening History</h2>
            <p className="mt-3 text-sm leading-7 opacity-75">
              View your uploaded voice samples, prediction results, and current
              processing state.
            </p>
          </div>

          <button
            type="button"
            onClick={() => fetchSamples(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-2xl border border-[var(--border)] px-4 py-3 text-sm font-medium transition hover:bg-[var(--muted)] disabled:opacity-70"
          >
            {refreshing ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <RefreshCw size={16} />
            )}
            Refresh
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-[28px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
          <p className="text-sm opacity-70">Total Uploads</p>
          <h3 className="mt-3 text-3xl font-bold">{totalUploads}</h3>
        </div>

        <div className="rounded-[28px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
          <p className="text-sm opacity-70">Latest Risk Result</p>
          <h3 className="mt-3 text-lg font-semibold">
            {latestPrediction?.risk_level || "—"}
          </h3>
        </div>

        <div className="rounded-[28px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
          <p className="text-sm opacity-70">Latest Confidence</p>
          <h3 className="mt-3 text-lg font-semibold">
            {latestPrediction?.confidence_score
              ? `${latestPrediction.confidence_score}%`
              : "—"}
          </h3>
        </div>
      </div>

      <div className="rounded-[28px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="inline-flex items-center gap-3 rounded-2xl border border-[var(--border)] px-5 py-3">
              <Loader2 className="animate-spin" size={18} />
              <span>Loading history...</span>
            </div>
          </div>
        ) : samples.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--muted)]">
              <FileAudio size={28} />
            </div>
            <h3 className="mt-5 text-xl font-semibold">No screening history yet</h3>
            <p className="mt-3 max-w-md text-sm leading-7 opacity-75">
              Once you upload voice samples from the New Screening page, they
              will appear here with timestamps and prediction details.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {samples.map((sample) => (
              <div
                key={sample.id}
                className="rounded-[24px] border border-[var(--border)] bg-[var(--background)] p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">
                      {sample.original_filename}
                    </h3>
                    <p className="text-xs opacity-60">{sample.stored_filename}</p>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-medium ${getStatusBadgeClasses(
                          sample.processing_status
                        )}`}
                      >
                        File: {sample.processing_status}
                      </span>

                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-medium ${getStatusBadgeClasses(
                          sample.prediction?.processing_status
                        )}`}
                      >
                        Prediction: {sample.prediction?.processing_status || "pending"}
                      </span>

                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-medium ${getRiskBadgeClasses(
                          sample.prediction?.risk_level
                        )}`}
                      >
                        Risk: {sample.prediction?.risk_level || "Not available"}
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-3 text-sm lg:min-w-[280px]">
                    <div>
                      <span className="opacity-60">Duration:</span>{" "}
                      <span className="font-medium">
                        {sample.duration_seconds ?? "—"}s
                      </span>
                    </div>
                    <div>
                      <span className="opacity-60">Size:</span>{" "}
                      <span className="font-medium">
                        {formatFileSize(sample.file_size)}
                      </span>
                    </div>
                    <div>
                      <span className="opacity-60">Uploaded:</span>{" "}
                      <span className="font-medium">
                        {formatDate(sample.uploaded_at || sample.created_at)}
                      </span>
                    </div>
                    <div>
                      <span className="opacity-60">Confidence:</span>{" "}
                      <span className="font-medium">
                        {sample.prediction?.confidence_score
                          ? `${sample.prediction.confidence_score}%`
                          : "—"}
                      </span>
                    </div>
                    <div>
                      <span className="opacity-60">Model:</span>{" "}
                      <span className="font-medium">
                        {sample.prediction?.model_used || "—"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide opacity-60">
                      Screening Summary
                    </p>
                    <p className="mt-3 text-sm leading-7 opacity-80">
                      {sample.prediction?.summary ||
                        "Summary will appear here once processing has completed."}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide opacity-60">
                      Processing Notes
                    </p>
                    <p className="mt-3 text-sm leading-7 opacity-80">
                      {sample.prediction?.error_message
                        ? sample.prediction.error_message
                        : sample.prediction?.processing_status === "completed"
                        ? "Prediction completed successfully."
                        : sample.prediction?.processing_status === "failed"
                        ? "Prediction failed during processing."
                        : "Prediction is pending or still processing."}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}