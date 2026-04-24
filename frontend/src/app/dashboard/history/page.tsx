"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AudioLines,
  BrainCircuit,
  ChevronDown,
  ChevronUp,
  FileAudio,
  Loader2,
  RefreshCw,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/app/lib/api";

type Prediction = {
  risk_level: string | null;
  confidence_score: string | number | null;
  rule_score?: number | null;
  hearth_score?: number | null;
  hearth_band?: string | null;
  score_breakdown?: {
    rule_score?: number | null;
    jitter_penalty?: number | null;
    shimmer_penalty?: number | null;
    silence_penalty?: number | null;
    zcr_penalty?: number | null;
    label_penalty?: number | null;
    confidence_bonus?: number | null;
  } | null;
  checkin_prompt?: string | null;
  user_note?: string | null;
  ai_coach_summary?: string | null;
  ai_recommendations?: string[] | null;
  ai_safety_note?: string | null;
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
  pitch_mean?: string | number | null;
  pitch_std?: string | number | null;
  voiced_ratio?: string | number | null;
  pitch_slope?: string | number | null;
  jitter_proxy?: string | number | null;
  tempo?: string | number | null;
  silence_ratio?: string | number | null;
  speaking_rate_proxy?: string | number | null;
  shimmer_proxy?: string | number | null;
  hnr_proxy?: string | number | null;
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
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

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
    return new Intl.DateTimeFormat("en-NG", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(dateString));
  };

  const formatFileSize = (size: number | null) => {
    if (!size) return "—";
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getRiskBadgeClasses = (riskLevel: string | null | undefined) => {
    if (!riskLevel) return "border-white/10 bg-white/[0.04] text-white/80";

    const normalized = riskLevel.toLowerCase();

    if (normalized.includes("high")) {
      return "border-red-500/30 bg-red-500/10 text-red-400";
    }

    if (normalized.includes("moderate")) {
      return "border-yellow-500/30 bg-yellow-500/10 text-yellow-300";
    }

    return "border-green-500/30 bg-green-500/10 text-green-400";
  };

  const getStatusBadgeClasses = (status: string | null | undefined) => {
    if (!status) return "border-white/10 bg-white/[0.04] text-white/80";

    const normalized = status.toLowerCase();

    if (normalized === "completed" || normalized === "processed") {
      return "border-green-500/30 bg-green-500/10 text-green-400";
    }

    if (normalized === "failed") {
      return "border-red-500/30 bg-red-500/10 text-red-400";
    }

    return "border-yellow-500/30 bg-yellow-500/10 text-yellow-300";
  };

  const getHearthScoreTone = (score?: number | null) => {
    if (score === null || score === undefined) {
      return "border-white/10 bg-white/[0.03] text-white";
    }

    if (score >= 75) return "border-green-500/30 bg-green-500/10 text-green-300";
    if (score >= 60) return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
    if (score >= 45) return "border-yellow-500/30 bg-yellow-500/10 text-yellow-300";
    if (score >= 25) return "border-orange-500/30 bg-orange-500/10 text-orange-300";

    return "border-red-500/30 bg-red-500/10 text-red-300";
  };

  return (
    <section className="space-y-6">
      <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-white">
              Screening History
            </h2>
            <p className="mt-3 text-sm leading-7 text-white/70">
              View your voice samples, Hearth Score, AI Coach insights,
              extracted biomarkers, and explainable screening breakdown.
            </p>
          </div>

          <button
            type="button"
            onClick={() => fetchSamples(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/[0.05] disabled:opacity-70"
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

      <div className="grid gap-6 md:grid-cols-5">
        <SummaryCard label="Total Uploads" value={totalUploads} />
        <SummaryCard label="Latest Risk" value={latestPrediction?.risk_level || "—"} />
        <SummaryCard
          label="Latest Confidence"
          value={
            latestPrediction?.confidence_score
              ? `${latestPrediction.confidence_score}%`
              : "—"
          }
        />
        <SummaryCard label="Latest Rule Score" value={latestPrediction?.rule_score ?? "—"} />

        <div className="rounded-[28px] border border-emerald-500/20 bg-emerald-500/10 p-6 shadow-sm">
          <p className="text-sm text-emerald-200/70">Latest Hearth Score</p>
          <h3 className="mt-3 text-3xl font-bold text-white">
            {latestPrediction?.hearth_score ?? "—"}
          </h3>
          <p className="mt-2 text-sm text-emerald-200/80">
            {latestPrediction?.hearth_band || "Not available"}
          </p>
        </div>
      </div>

      <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="inline-flex items-center gap-3 rounded-2xl border border-white/10 px-5 py-3 text-white">
              <Loader2 className="animate-spin" size={18} />
              <span>Loading history...</span>
            </div>
          </div>
        ) : samples.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/[0.06] text-white">
              <FileAudio size={28} />
            </div>
            <h3 className="mt-5 text-xl font-semibold text-white">
              No screening history yet
            </h3>
            <p className="mt-3 max-w-md text-sm leading-7 text-white/70">
              Once you complete a screening, your results and AI Coach insights
              will appear here.
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
                  className="rounded-[24px] border border-white/10 bg-black/20 p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-white">
                        {sample.original_filename}
                      </h3>
                      <p className="text-xs text-white/50">
                        {sample.stored_filename}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Badge className={getStatusBadgeClasses(sample.processing_status)}>
                          File: {sample.processing_status}
                        </Badge>

                        <Badge
                          className={getStatusBadgeClasses(
                            sample.prediction?.processing_status
                          )}
                        >
                          Prediction: {sample.prediction?.processing_status || "pending"}
                        </Badge>

                        <Badge
                          className={getRiskBadgeClasses(sample.prediction?.risk_level)}
                        >
                          Risk: {sample.prediction?.risk_level || "Not available"}
                        </Badge>

                        <Badge
                          className={getHearthScoreTone(
                            sample.prediction?.hearth_score
                          )}
                        >
                          Hearth Score: {sample.prediction?.hearth_score ?? "—"}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid gap-3 text-sm text-white/85 lg:min-w-[320px]">
                      <InfoRow label="Duration" value={`${sample.duration_seconds ?? "—"}s`} />
                      <InfoRow label="Size" value={formatFileSize(sample.file_size)} />
                      <InfoRow
                        label="Uploaded"
                        value={formatDate(sample.uploaded_at || sample.created_at)}
                      />
                      <InfoRow
                        label="Confidence"
                        value={
                          sample.prediction?.confidence_score
                            ? `${sample.prediction.confidence_score}%`
                            : "—"
                        }
                      />
                      <InfoRow
                        label="Rule Score"
                        value={sample.prediction?.rule_score ?? "—"}
                      />
                      <InfoRow
                        label="Hearth Band"
                        value={sample.prediction?.hearth_band ?? "—"}
                      />
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-center gap-2 text-white">
                        <BrainCircuit size={18} />
                        <p className="text-sm font-semibold">
                          Screening Overview
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setOpenItemId((prev) =>
                            prev === sample.id ? null : sample.id
                          )
                        }
                        className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/[0.05]"
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

                    <p className="mt-4 text-sm leading-7 text-white/80">
                      {sample.prediction?.summary ||
                        "Summary will appear here once processing has completed."}
                    </p>
                  </div>

                  {isOpen && (
                    <div className="mt-5 space-y-4">
                      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5">
                        <div className="flex items-center gap-2 text-emerald-200">
                          <Sparkles size={18} />
                          <p className="text-sm font-semibold">
                            AI Coach Insight
                          </p>
                        </div>

                        <div className="mt-5 grid gap-4 xl:grid-cols-2">
                          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                            <p className="text-xs uppercase tracking-wide text-white/45">
                              Check-in Prompt
                            </p>
                            <p className="mt-2 text-sm leading-7 text-white/80">
                              {sample.prediction?.checkin_prompt ||
                                "No check-in prompt saved."}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                            <p className="text-xs uppercase tracking-wide text-white/45">
                              Your Note
                            </p>
                            <p className="mt-2 text-sm leading-7 text-white/80">
                              {sample.prediction?.user_note ||
                                "No personal note was added for this screening."}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                          <p className="text-xs uppercase tracking-wide text-white/45">
                            AI Coach Summary
                          </p>
                          <p className="mt-2 text-sm leading-7 text-white/80">
                            {sample.prediction?.ai_coach_summary ||
                              "No AI Coach summary available for this screening."}
                          </p>
                        </div>

                        {Array.isArray(sample.prediction?.ai_recommendations) &&
                          sample.prediction.ai_recommendations.length > 0 && (
                            <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                              <p className="text-xs uppercase tracking-wide text-white/45">
                                Recommended Next Steps
                              </p>
                              <ul className="mt-3 space-y-3 text-sm leading-7 text-white/75">
                                {sample.prediction.ai_recommendations.map(
                                  (item, index) => (
                                    <li key={`${item}-${index}`} className="flex gap-3">
                                      <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-emerald-300" />
                                      <span>{item}</span>
                                    </li>
                                  )
                                )}
                              </ul>
                            </div>
                          )}

                        <p className="mt-4 text-xs leading-6 text-white/55">
                          {sample.prediction?.ai_safety_note ||
                            "Hearth provides wellness guidance, not medical diagnosis."}
                        </p>
                      </div>

                      <div className="grid gap-4 xl:grid-cols-4">
                        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5">
                          <div className="flex items-center gap-2 text-emerald-200">
                            <Activity size={16} />
                            <p className="text-xs font-semibold uppercase tracking-wide">
                              Hearth Score
                            </p>
                          </div>

                          <h3 className="mt-4 text-4xl font-bold text-white">
                            {sample.prediction?.hearth_score ?? "—"}
                          </h3>
                          <p className="mt-2 text-sm text-emerald-200/90">
                            {sample.prediction?.hearth_band ?? "Not available"}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 xl:col-span-3">
                          <div className="flex items-center gap-2 text-white">
                            <ShieldAlert size={16} />
                            <p className="text-xs font-semibold uppercase tracking-wide text-white/60">
                              Score Breakdown
                            </p>
                          </div>

                          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                            <FeatureChip label="Rule Score" value={sample.prediction?.score_breakdown?.rule_score} />
                            <FeatureChip label="Jitter Penalty" value={sample.prediction?.score_breakdown?.jitter_penalty} />
                            <FeatureChip label="Shimmer Penalty" value={sample.prediction?.score_breakdown?.shimmer_penalty} />
                            <FeatureChip label="Silence Penalty" value={sample.prediction?.score_breakdown?.silence_penalty} />
                            <FeatureChip label="ZCR Penalty" value={sample.prediction?.score_breakdown?.zcr_penalty} />
                            <FeatureChip label="Label Penalty" value={sample.prediction?.score_breakdown?.label_penalty} />
                            <FeatureChip label="Confidence Bonus" value={sample.prediction?.score_breakdown?.confidence_bonus} />
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-4 xl:grid-cols-3">
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                          <div className="flex items-center gap-2 text-white">
                            <ShieldAlert size={16} />
                            <p className="text-xs font-semibold uppercase tracking-wide text-white/60">
                              Rule Breakdown
                            </p>
                          </div>

                          <div className="mt-4 space-y-3 text-sm text-white">
                            <RuleRow label="Energy Instability" value={ruleScore?.energy_instability_score} />
                            <RuleRow label="MFCC Variability" value={ruleScore?.mfcc_variability_score} />
                            <RuleRow label="Spectral Fluctuation" value={ruleScore?.spectral_fluctuation_score} />
                            <RuleRow label="ZCR Activity" value={ruleScore?.zcr_activity_score} />
                            <div className="flex items-center justify-between rounded-xl border border-white/10 px-3 py-2 font-semibold">
                              <span>Total Score</span>
                              <span>{ruleScore?.total_score ?? "—"}</span>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 xl:col-span-2">
                          <div className="flex items-center gap-2 text-white">
                            <AudioLines size={16} />
                            <p className="text-xs font-semibold uppercase tracking-wide text-white/60">
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
                            <FeatureChip label="Pitch Mean" value={sample.feature?.pitch_mean} />
                            <FeatureChip label="Pitch Std" value={sample.feature?.pitch_std} />
                            <FeatureChip label="Voiced Ratio" value={sample.feature?.voiced_ratio} digits={4} />
                            <FeatureChip label="Pitch Slope" value={sample.feature?.pitch_slope} digits={4} />
                            <FeatureChip label="Jitter Proxy" value={sample.feature?.jitter_proxy} digits={4} />
                            <FeatureChip label="Tempo" value={sample.feature?.tempo} />
                            <FeatureChip label="Silence Ratio" value={sample.feature?.silence_ratio} digits={4} />
                            <FeatureChip label="Speaking Rate" value={sample.feature?.speaking_rate_proxy} digits={4} />
                            <FeatureChip label="Shimmer Proxy" value={sample.feature?.shimmer_proxy} digits={4} />
                            <FeatureChip label="HNR Proxy" value={sample.feature?.hnr_proxy} digits={4} />
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-4 xl:grid-cols-2">
                        <NoteCard
                          title="Rule Notes"
                          text={
                            ruleScore?.notes ||
                            "Rule-based notes will appear here after scoring."
                          }
                        />

                        <NoteCard
                          title="Processing Notes"
                          text={
                            sample.prediction?.error_message
                              ? sample.prediction.error_message
                              : sample.prediction?.processing_status === "completed"
                              ? "Prediction completed successfully using the current Hearth intelligence engine."
                              : sample.prediction?.processing_status === "failed"
                              ? "Prediction failed during processing."
                              : "Prediction is pending or still processing."
                          }
                          footerLabel="Model Used"
                          footerValue={sample.prediction?.model_used || "—"}
                        />
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

function SummaryCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 shadow-sm">
      <p className="text-sm text-white/60">{label}</p>
      <h3 className="mt-3 text-lg font-semibold text-white">{value}</h3>
    </div>
  );
}

function Badge({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-medium ${className}`}>
      {children}
    </span>
  );
}

function InfoRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <span className="text-white/60">{label}:</span>{" "}
      <span className="font-medium">{value}</span>
    </div>
  );
}

function RuleRow({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-white/[0.04] px-3 py-2">
      <span>{label}</span>
      <span className="font-semibold">{value ?? "—"}</span>
    </div>
  );
}

function NoteCard({
  title,
  text,
  footerLabel,
  footerValue,
}: {
  title: string;
  text: string;
  footerLabel?: string;
  footerValue?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-white/60">
        {title}
      </p>
      <p className="mt-3 text-sm leading-7 text-white/80">{text}</p>

      {footerLabel && (
        <div className="mt-4 text-sm text-white/85">
          <span className="text-white/60">{footerLabel}:</span>{" "}
          <span className="font-medium">{footerValue}</span>
        </div>
      )}
    </div>
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
    <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3">
      <p className="text-[11px] uppercase tracking-wide text-white/50">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-white">{formatted}</p>
    </div>
  );
}