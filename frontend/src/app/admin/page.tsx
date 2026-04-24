"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  Database,
  Download,
  HeartPulse,
  Loader2,
  Moon,
  Smile,
  GraduationCap,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/app/lib/api";

type Stats = {
  total_consents: number;
  total_surveys: number;
  training_ready_samples: number;
  avg_stress_level: number;
  avg_sleep_quality: number;
  avg_mood_score: number;
  avg_study_pressure: number;
  avg_energy_level: number;
};

export default function AdminResearchPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const fetchStats = async () => {
    try {
      setLoading(true);

      const res = await api.get("/api/admin/research/stats");
      setStats(res.data.data);
    } catch (error: any) {
      toast.error("Unable to load research dataset stats.");
    } finally {
      setLoading(false);
    }
  };

  const exportCsv = async () => {
    try {
      setExporting(true);

      const response = await api.get("/api/admin/research/export", {
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `hearth-africa-dataset-${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);

      toast.success("Dataset exported successfully.");
    } catch (error: any) {
      toast.error("Export failed.");
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center text-white">
        <Loader2 className="mr-3 animate-spin" />
        Loading research intelligence...
      </div>
    );
  }

  if (!stats) return null;

  return (
    <section className="space-y-6">
      {/* Hero */}
      <div className="rounded-[32px] border border-cyan-400/20 bg-gradient-to-br from-cyan-500/10 via-emerald-500/10 to-transparent p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-cyan-200">
              <Database size={14} />
              Proprietary Dataset
            </div>

            <h1 className="mt-4 text-3xl font-bold text-white md:text-5xl">
              Hearth Africa Research Intelligence
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/65">
              Real student wellness labels + voice signals powering your future
              proprietary AI models.
            </p>
          </div>

          <button
            onClick={exportCsv}
            disabled={exporting}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-500 px-5 py-3 font-semibold text-white transition hover:bg-cyan-400 disabled:opacity-70"
          >
            {exporting ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Download size={18} />
            )}
            Export CSV
          </button>
        </div>
      </div>

      {/* Core Metrics */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Research Consents"
          value={stats.total_consents}
          icon={<ShieldCheck />}
          color="cyan"
        />

        <MetricCard
          title="Submitted Surveys"
          value={stats.total_surveys}
          icon={<Activity />}
          color="emerald"
        />

        <MetricCard
          title="Training Ready Samples"
          value={stats.training_ready_samples}
          icon={<Database />}
          color="purple"
        />

        <MetricCard
          title="Avg Stress Score"
          value={`${stats.avg_stress_level}/10`}
          icon={<HeartPulse />}
          color="red"
        />
      </div>

      {/* Biomarkers */}
      <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Avg Sleep Quality"
          value={`${stats.avg_sleep_quality}/10`}
          icon={<Moon />}
          color="indigo"
        />

        <MetricCard
          title="Avg Mood Score"
          value={`${stats.avg_mood_score}/10`}
          icon={<Smile />}
          color="yellow"
        />

        <MetricCard
          title="Avg Study Pressure"
          value={`${stats.avg_study_pressure}/10`}
          icon={<GraduationCap />}
          color="orange"
        />

        <MetricCard
          title="Avg Energy Level"
          value={`${stats.avg_energy_level}/10`}
          icon={<Activity />}
          color="green"
        />
      </div>

      {/* Investor Narrative */}
      <div className="rounded-[30px] border border-white/10 bg-white/[0.04] p-7">
        <h3 className="text-xl font-bold text-white">
          Why This Matters
        </h3>

        <div className="mt-5 grid gap-5 md:grid-cols-3">
          <InsightBox
            title="Moat"
            text="You are building a proprietary African wellness voice dataset no competitor owns."
          />

          <InsightBox
            title="Accuracy"
            text="Future Hearth models improve using real student labels instead of generic actor datasets."
          />

          <InsightBox
            title="Investor Signal"
            text="Data ownership + distribution + recurring usage creates venture-grade defensibility."
          />
        </div>
      </div>
    </section>
  );
}

/* Components */

function MetricCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}) {
  const bg =
    color === "cyan"
      ? "from-cyan-500/10"
      : color === "emerald"
      ? "from-emerald-500/10"
      : color === "purple"
      ? "from-purple-500/10"
      : color === "red"
      ? "from-red-500/10"
      : color === "indigo"
      ? "from-indigo-500/10"
      : color === "yellow"
      ? "from-yellow-500/10"
      : color === "orange"
      ? "from-orange-500/10"
      : "from-green-500/10";

  return (
    <div
      className={`rounded-[28px] border border-white/10 bg-gradient-to-br ${bg} to-transparent p-6`}
    >
      <div className="flex items-center justify-between text-white/60">
        <span className="text-sm">{title}</span>
        {icon}
      </div>

      <div className="mt-5 text-3xl font-bold text-white">
        {value}
      </div>
    </div>
  );
}

function InsightBox({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
      <h4 className="text-lg font-semibold text-white">{title}</h4>
      <p className="mt-3 text-sm leading-7 text-white/65">{text}</p>
    </div>
  );
}