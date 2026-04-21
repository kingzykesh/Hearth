"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Loader2,
  RefreshCw,
  FileAudio,
  AudioLines,
  ChevronDown,
  ChevronUp,
  BrainCircuit,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/app/lib/api";

type Prediction = {
  risk_level: string | null;
  confidence_score: string | number | null;
  rule_score?: number | null;
  summary: string | null;
  model_used: string | null;
  processing_status: string;
  error_message?: string | null;
  feature_payload?: Record<string, string | number | null> | null;
} | null;

type RuleScore = {
  total_score?: number | null;
  energy_instability_score?: number | null;
  mfcc_variability_score?: number | null;
  spectral_fluctuation_score?: number | null;
  zcr_activity_score?: number | null;
  notes?: string | null;
} | null;

type FeatureRecord = {
  duration_seconds?: string | number | null;
  mfcc_mean?: string | number | null;
  mfcc_std?: string | number | null;
  mfcc_delta_mean?: string | number | null;
  mfcc_delta_std?: string | number | null;
  mfcc_delta2_mean?: string | number | null;
  mfcc_delta2_std?: string | number | null;
  spectral_centroid_mean?: string | number | null;
  spectral_centroid_std?: string | number | null;
  spectral_rolloff_mean?: string | number | null;
  spectral_rolloff_std?: string | number | null;
  spectral_bandwidth_mean?: string | number | null;
  spectral_bandwidth_std?: string | number | null;
  rms_mean?: string | number | null;
  rms_std?: string | number | null;
  zcr_mean?: string | number | null;
  zcr_std?: string | number | null;
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
  rule_score?: RuleScore;
  ruleScore?: RuleScore;
  feature?: FeatureRecord;
};

export default function ScreeningHistoryPage() {
  const [samples, setSamples] = useState<VoiceSample[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [openItemId, setOpenItemId] = useState<number | null>(null);

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

  const formatValue = (value: string | number | null | undefined, digits = 2) => {
    if (value === null || value === undefined || value === "") return "—";
    if (typeof value === "number") return value.toFixed(digits);
    const parsed = Number(value);
    return Number.isNaN(parsed) ? String(value) : parsed.toFixed(digits);
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
              View your uploaded voice samples, prediction results, extracted
              features, and explainable rule breakdown.
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

      <div className="grid gap-6 md:grid-cols-4">
        <div className="rounded-[28px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
          <p className="text-sm opacity-70">Total Uploads</p>
          <h3 className="mt-3 text-3xl font-bold">{totalUploads}</h3>
        </div>

        <div className="rounded-[28px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
          <p className="text-sm opacity-70">Latest Risk</p>
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

        <div className="rounded-[28px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
          <p className="text-sm opacity-70">Latest Rule Score</p>
          <h3 className="mt-3 text-lg font-semibold">
            {latestPrediction?.rule_score ?? "—"}
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
              will appear here with full explainable details.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {samples.map((sample) => {
              const ruleScore = sample.ruleScore || sample.rule_score || null;
              const isOpen = openItemId === sample.id;

              return (
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

                    <div className="grid gap-3 text-sm lg:min-w-[300px]">
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
                        <span className="opacity-60">Rule Score:</span>{" "}
                        <span className="font-medium">
                          {sample.prediction?.rule_score ?? "—"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-center gap-2">
                        <BrainCircuit size={18} />
                        <p className="text-sm font-semibold">Screening Overview</p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setOpenItemId((prev) => (prev === sample.id ? null : sample.id))
                        }
                        className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-3 py-2 text-sm font-medium transition hover:bg-[var(--muted)]"
                      >
                        {isOpen ? (
                          <>
                            <ChevronUp size={16} />
                            Hide Details
                          </>
                        ) : (
                          <>
                            <ChevronDown size={16} />
                            View Details
                          </>
                        )}
                      </button>
                    </div>

                    <p className="mt-4 text-sm leading-7 opacity-80">
                      {sample.prediction?.summary ||
                        "Summary will appear here once processing has completed."}
                    </p>
                  </div>

                  {isOpen && (
                    <div className="mt-5 space-y-4">
                      <div className="grid gap-4 xl:grid-cols-3">
                        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
                          <div className="flex items-center gap-2">
                            <ShieldAlert size={16} />
                            <p className="text-xs font-semibold uppercase tracking-wide opacity-60">
                              Rule Breakdown
                            </p>
                          </div>

                          <div className="mt-4 space-y-3 text-sm">
                            <div className="flex items-center justify-between rounded-xl bg-[var(--muted)] px-3 py-2">
                              <span>Energy Instability</span>
                              <span className="font-semibold">
                                {ruleScore?.energy_instability_score ?? "—"}
                              </span>
                            </div>
                            <div className="flex items-center justify-between rounded-xl bg-[var(--muted)] px-3 py-2">
                              <span>MFCC Variability</span>
                              <span className="font-semibold">
                                {ruleScore?.mfcc_variability_score ?? "—"}
                              </span>
                            </div>
                            <div className="flex items-center justify-between rounded-xl bg-[var(--muted)] px-3 py-2">
                              <span>Spectral Fluctuation</span>
                              <span className="font-semibold">
                                {ruleScore?.spectral_fluctuation_score ?? "—"}
                              </span>
                            </div>
                            <div className="flex items-center justify-between rounded-xl bg-[var(--muted)] px-3 py-2">
                              <span>ZCR Activity</span>
                              <span className="font-semibold">
                                {ruleScore?.zcr_activity_score ?? "—"}
                              </span>
                            </div>
                            <div className="flex items-center justify-between rounded-xl border border-[var(--border)] px-3 py-2 font-semibold">
                              <span>Total Score</span>
                              <span>{ruleScore?.total_score ?? "—"}</span>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 xl:col-span-2">
                          <div className="flex items-center gap-2">
                            <AudioLines size={16} />
                            <p className="text-xs font-semibold uppercase tracking-wide opacity-60">
                              Extracted Features
                            </p>
                          </div>

                          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                            <FeatureChip label="Duration" value={sample.feature?.duration_seconds} />
                            <FeatureChip label="MFCC Mean" value={sample.feature?.mfcc_mean} />
                            <FeatureChip label="MFCC Std" value={sample.feature?.mfcc_std} />
                            <FeatureChip label="MFCC Δ Mean" value={sample.feature?.mfcc_delta_mean} />
                            <FeatureChip label="MFCC Δ Std" value={sample.feature?.mfcc_delta_std} />
                            <FeatureChip label="MFCC Δ² Mean" value={sample.feature?.mfcc_delta2_mean} />
                            <FeatureChip label="MFCC Δ² Std" value={sample.feature?.mfcc_delta2_std} />
                            <FeatureChip label="Spec. Centroid Mean" value={sample.feature?.spectral_centroid_mean} />
                            <FeatureChip label="Spec. Centroid Std" value={sample.feature?.spectral_centroid_std} />
                            <FeatureChip label="Rolloff Mean" value={sample.feature?.spectral_rolloff_mean} />
                            <FeatureChip label="Rolloff Std" value={sample.feature?.spectral_rolloff_std} />
                            <FeatureChip label="Bandwidth Mean" value={sample.feature?.spectral_bandwidth_mean} />
                            <FeatureChip label="Bandwidth Std" value={sample.feature?.spectral_bandwidth_std} />
                            <FeatureChip label="RMS Mean" value={sample.feature?.rms_mean} digits={4} />
                            <FeatureChip label="RMS Std" value={sample.feature?.rms_std} digits={4} />
                            <FeatureChip label="ZCR Mean" value={sample.feature?.zcr_mean} digits={4} />
                            <FeatureChip label="ZCR Std" value={sample.feature?.zcr_std} digits={4} />
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-4 xl:grid-cols-2">
                        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide opacity-60">
                            Rule Notes
                          </p>
                          <p className="mt-3 text-sm leading-7 opacity-80">
                            {ruleScore?.notes ||
                              "Rule-based notes will appear here after scoring."}
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
                              ? "Prediction completed successfully using the current rule-based signal processing engine."
                              : sample.prediction?.processing_status === "failed"
                              ? "Prediction failed during processing."
                              : "Prediction is pending or still processing."}
                          </p>

                          <div className="mt-4 text-sm">
                            <span className="opacity-60">Model Used:</span>{" "}
                            <span className="font-medium">
                              {sample.prediction?.model_used || "—"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function FeatureChip({
  label,
  value,
  digits = 2,
}: {
  label: string;
  value: string | number | null | undefined;
  digits?: number;
}) {
  const formatted =
    value === null || value === undefined || value === ""
      ? "—"
      : typeof value === "number"
      ? value.toFixed(digits)
      : Number.isNaN(Number(value))
      ? String(value)
      : Number(value).toFixed(digits);

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)] px-3 py-3">
      <p className="text-[11px] uppercase tracking-wide opacity-60">{label}</p>
      <p className="mt-2 text-sm font-semibold">{formatted}</p>
    </div>
  );
}