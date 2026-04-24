"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BrainCircuit,
  Loader2,
  Shield,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/app/lib/api";

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      const res = await api.get("/api/admin/analytics");
      setData(res.data.data);
    } catch (error: any) {
      toast.error("Unable to load analytics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center text-white">
        <Loader2 className="animate-spin mr-3" />
        Loading Analytics...
      </div>
    );
  }

  const metrics = data.metrics;
  const ai = data.ai_cohort_insight;

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
        <h1 className="text-3xl font-bold text-white">
          Hearth Admin Intelligence
        </h1>
        <p className="mt-2 text-white/60">
          Real-time cohort wellness analytics and AI insights.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card
          icon={<Users />}
          label="Users"
          value={metrics.total_users}
        />
        <Card
          icon={<Activity />}
          label="Screenings"
          value={metrics.total_screenings}
        />
        <Card
          icon={<Shield />}
          label="Avg Hearth Score"
          value={metrics.avg_hearth_score}
        />
        <Card
          icon={<BrainCircuit />}
          label="Success Rate"
          value={`${metrics.success_rate}%`}
        />
      </div>

      <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-6">
        <div className="flex items-center gap-3">
          <BrainCircuit className="text-emerald-300" />
          <h2 className="text-xl font-semibold text-white">
            AI Cohort Insight
          </h2>
        </div>

        <p className="mt-4 text-white/80 leading-7">
          {ai.summary}
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <MiniStat
            label="High Risk %"
            value={`${ai.high_risk_percent}%`}
          />
          <MiniStat
            label="Moderate Risk %"
            value={`${ai.moderate_risk_percent}%`}
          />
          <MiniStat
            label="Status"
            value={ai.status}
          />
        </div>

        <div className="mt-6">
          <p className="text-sm text-white/50 mb-3">
            Recommended Actions
          </p>

          <ul className="space-y-3">
            {ai.recommendations.map((item: string, index: number) => (
              <li
                key={index}
                className="rounded-2xl bg-black/20 px-4 py-3 text-white/80"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <h3 className="text-lg font-semibold text-white">
            At-Risk Watchlist
          </h3>

          <div className="mt-5 space-y-4">
            {data.at_risk_watchlist.map((item: any) => (
              <div
                key={item.id}
                className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4"
              >
                <div className="flex items-center gap-2 text-red-300">
                  <AlertTriangle size={16} />
                  <span>{item.user_name}</span>
                </div>

                <p className="mt-2 text-sm text-white/80">
                  Score: {item.hearth_score} • {item.risk_level}
                </p>

                <p className="mt-2 text-xs text-white/50">
                  {item.user_email}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <h3 className="text-lg font-semibold text-white">
            Top AI Recommendations
          </h3>

          <div className="mt-5 space-y-4">
            {data.top_recommendations.map((item: any, index: number) => (
              <div
                key={index}
                className="rounded-2xl bg-white/[0.04] px-4 py-3 flex justify-between"
              >
                <span className="text-white/80">
                  {item.recommendation}
                </span>
                <span className="text-emerald-300 font-semibold">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Card({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
      <div className="flex items-center justify-between text-white/70">
        <span>{label}</span>
        {icon}
      </div>

      <h3 className="mt-4 text-3xl font-bold text-white">
        {value}
      </h3>
    </div>
  );
}

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl bg-black/20 p-4">
      <p className="text-sm text-white/50">{label}</p>
      <p className="mt-2 text-xl font-semibold text-white">
        {value}
      </p>
    </div>
  );
}