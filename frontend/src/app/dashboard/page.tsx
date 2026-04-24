"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BrainCircuit,
  FileAudio,
  Loader2,
  RefreshCw,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Minus,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import api from "@/app/lib/api";

type DashboardSummary = {
  user_name: string;
  total_screenings: number;
  last_screening_date: string | null;
  last_result: string | null;
  last_confidence: number | string | null;
  last_rule_score?: number | string | null;
  last_summary: string | null;
  last_status: string | null;
  last_model_used: string | null;
  last_hearth_score?: number | null;
  last_hearth_band?: string | null;
  last_checkin_prompt?: string | null;
  last_user_note?: string | null;
  last_ai_coach_summary?: string | null;
  last_ai_recommendations?: string[] | null;
  last_ai_safety_note?: string | null;
  email_verified: boolean;
};

type TrendItem = {
  hearth_score: number;
  risk_level: string | null;
  hearth_band: string | null;
  confidence_score: number | string | null;
  created_at: string;
};

type TrendData = {
  items: TrendItem[];
  weekly_change: number | null;
  trend: "improving" | "declining" | "stable";
  message: string;
};

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [trendData, setTrendData] = useState<TrendData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const [summaryResponse, trendResponse] = await Promise.all([
        api.get("/api/dashboard-summary"),
        api.get("/api/wellness-trend"),
      ]);

      setSummary(summaryResponse.data.data);
      setTrendData(trendResponse.data.data);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Unable to load dashboard data."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const chartData = useMemo(() => {
    return (
      trendData?.items?.map((item) => ({
        date: new Intl.DateTimeFormat("en-NG", {
          month: "short",
          day: "numeric",
        }).format(new Date(item.created_at)),
        score: item.hearth_score,
        risk: item.risk_level || "—",
      })) || []
    );
  }, [trendData]);

  const latestScore = summary?.last_hearth_score ?? null;
  const latestBand = summary?.last_hearth_band || "Not available";

  const getTrendIcon = () => {
    if (trendData?.trend === "improving") {
      return <TrendingUp size={18} className="text-green-400" />;
    }

    if (trendData?.trend === "declining") {
      return <TrendingDown size={18} className="text-red-400" />;
    }

    return <Minus size={18} className="text-yellow-300" />;
  };

  const getTrendText = () => {
    if (!trendData) return "No trend data yet.";

    if (trendData.weekly_change === null) {
      return "Not enough screenings yet.";
    }

    const sign = trendData.weekly_change > 0 ? "+" : "";
    return `${sign}${trendData.weekly_change} points`;
  };

  const getScoreTone = (score: number | null) => {
    if (score === null) return "text-white";

    if (score >= 75) return "text-green-300";
    if (score >= 60) return "text-emerald-300";
    if (score >= 45) return "text-yellow-300";
    if (score >= 25) return "text-orange-300";
    return "text-red-300";
  };

  if (loading) {
    return (
      <section className="flex min-h-[60vh] items-center justify-center">
        <div className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3 text-white">
          <Loader2 className="animate-spin" size={18} />
          <span>Loading Hearth dashboard...</span>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-emerald-300/70">
              Hearth Intelligence
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-white">
              Welcome back, {summary?.user_name || "there"}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/70">
              Track your vocal wellness, stress signals, AI coach insights, and
              screening progress over time.
            </p>
          </div>

          <button
            type="button"
            onClick={() => fetchDashboard(true)}
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

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-[32px] border border-emerald-500/20 bg-emerald-500/10 p-6 shadow-sm xl:col-span-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-emerald-200/70">Hearth Score</p>
              <h3 className={`mt-4 text-6xl font-bold ${getScoreTone(latestScore)}`}>
                {latestScore ?? "—"}
              </h3>
            </div>

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-200">
              <Activity size={26} />
            </div>
          </div>

          <p className="mt-4 text-lg font-semibold text-white">{latestBand}</p>
          <p className="mt-3 text-sm leading-7 text-emerald-100/70">
            Your Hearth Score summarizes your vocal wellness based on acoustic
            biomarkers, rule-based scoring, and AI stress model signals.
          </p>
        </div>

        <StatCard
          icon={<FileAudio size={22} />}
          label="Total Screenings"
          value={summary?.total_screenings ?? 0}
          hint="All completed and attempted uploads."
        />

        <StatCard
          icon={<ShieldCheck size={22} />}
          label="Latest Risk"
          value={summary?.last_result || "—"}
          hint={`Status: ${summary?.last_status || "—"}`}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 shadow-sm xl:col-span-2">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-xl font-semibold text-white">
                Hearth Score Trend
              </h3>
              <p className="mt-2 text-sm text-white/60">
                Your recent screening score movement.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white">
              {getTrendIcon()}
              <span>{getTrendText()}</span>
            </div>
          </div>

          <div className="mt-6 h-[320px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                  <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.65)" }} />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fill: "rgba(255,255,255,0.65)" }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#07110d",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: "16px",
                      color: "#fff",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-3xl border border-dashed border-white/10 text-center">
                <div>
                  <BrainCircuit className="mx-auto text-white/50" size={32} />
                  <p className="mt-3 text-sm text-white/60">
                    No Hearth Score trend yet. Complete a screening to begin.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-300">
              <BrainCircuit size={22} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Trend Insight</h3>
              <p className="text-sm text-white/50">Recent wellness movement</p>
            </div>
          </div>

          <p className="mt-6 text-sm leading-7 text-white/75">
            {trendData?.message || "Complete more screenings to generate trend insight."}
          </p>

          <div className="mt-6 space-y-4">
            <MiniMetric label="Weekly Change" value={getTrendText()} />
            <MiniMetric
              label="Latest Confidence"
              value={
                summary?.last_confidence ? `${summary.last_confidence}%` : "—"
              }
            />
            <MiniMetric
              label="Latest Rule Score"
              value={summary?.last_rule_score ?? "—"}
            />
            <MiniMetric label="Model" value={summary?.last_model_used || "—"} />
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 shadow-sm">
        <h3 className="text-xl font-semibold text-white">Latest Screening Summary</h3>
        <p className="mt-4 text-sm leading-7 text-white/75">
          {summary?.last_summary ||
            "No screening summary yet. Start a new screening to generate your first Hearth intelligence report."}
        </p>
      </div>

      <div className="rounded-[28px] border border-emerald-500/20 bg-emerald-500/10 p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-200">
            <Sparkles size={22} />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">
              Latest AI Coach Insight
            </h3>
            <p className="text-sm text-emerald-100/60">
              Personalized wellness guidance from your latest check-in.
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs uppercase tracking-wide text-white/45">Prompt</p>
          <p className="mt-2 text-sm text-white/80">
            {summary?.last_checkin_prompt || "No check-in prompt yet."}
          </p>
        </div>

        {summary?.last_user_note && (
          <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-wide text-white/45">
              Your Note
            </p>
            <p className="mt-2 text-sm leading-7 text-white/80">
              {summary.last_user_note}
            </p>
          </div>
        )}

        <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs uppercase tracking-wide text-white/45">
            AI Coach Summary
          </p>
          <p className="mt-2 text-sm leading-7 text-white/80">
            {summary?.last_ai_coach_summary ||
              "No AI Coach insight yet. Complete a new screening to generate one."}
          </p>
        </div>

        {Array.isArray(summary?.last_ai_recommendations) &&
          summary.last_ai_recommendations.length > 0 && (
            <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-wide text-white/45">
                Recommended Next Steps
              </p>
              <ul className="mt-3 space-y-3 text-sm leading-7 text-white/75">
                {summary.last_ai_recommendations.map((item, index) => (
                  <li key={`${item}-${index}`} className="flex gap-3">
                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-emerald-300" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

        <p className="mt-4 text-xs leading-6 text-white/50">
          {summary?.last_ai_safety_note ||
            "Hearth provides wellness guidance, not medical diagnosis."}
        </p>
      </div>
    </section>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  hint: string;
}) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm text-white/60">{label}</p>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/[0.05] text-emerald-300">
          {icon}
        </div>
      </div>
      <h3 className="mt-5 text-3xl font-bold text-white">{value}</h3>
      <p className="mt-3 text-sm leading-6 text-white/55">{hint}</p>
    </div>
  );
}

function MiniMetric({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <p className="text-xs uppercase tracking-wide text-white/45">{label}</p>
      <p className="mt-2 text-sm font-semibold text-white">{value ?? "—"}</p>
    </div>
  );
}