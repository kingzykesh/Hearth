"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/app/lib/api";
import AdminStatCard from "@/app/components/admin/admin-stat-card";
import {
  BarChart,
  Bar,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

type AnalyticsData = {
  risk_distribution: {
    low_risk: number;
    high_risk: number;
  };
  processing_distribution: {
    completed: number;
    failed: number;
    pending: number;
  };
  trend_7_days: {
    date: string;
    count: number;
  }[];
  metrics: {
    total_users: number;
    active_users: number;
    total_screenings: number;
    total_predictions: number;
    avg_confidence: number;
    avg_rule_score: number;
    success_rate: number;
  };
};

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await api.get("/api/admin/analytics");
        setAnalytics(response.data.data);
      } catch (error: any) {
        toast.error(
          error?.response?.data?.message || "Unable to load analytics."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <section className="flex min-h-[40vh] items-center justify-center">
        <div className="inline-flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-5 py-3">
          <Loader2 className="animate-spin" size={18} />
          <span>Loading analytics...</span>
        </div>
      </section>
    );
  }

  const riskChartData = [
    {
      name: "Low Risk",
      value: analytics?.risk_distribution.low_risk ?? 0,
    },
    {
      name: "High Risk",
      value: analytics?.risk_distribution.high_risk ?? 0,
    },
  ];

  const processingChartData = [
    {
      name: "Completed",
      value: analytics?.processing_distribution.completed ?? 0,
    },
    {
      name: "Failed",
      value: analytics?.processing_distribution.failed ?? 0,
    },
    {
      name: "Pending",
      value: analytics?.processing_distribution.pending ?? 0,
    },
  ];

  const trendData = analytics?.trend_7_days ?? [];

  return (
    <section className="space-y-6">
      <div className="rounded-[28px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <h2 className="text-2xl font-semibold">Analytics</h2>
        <p className="mt-2 text-sm opacity-70">
          Platform-wide charts and operational performance insights.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="Total Users"
          value={analytics?.metrics.total_users ?? 0}
          hint="All registered accounts."
        />
        <AdminStatCard
          label="Active Users"
          value={analytics?.metrics.active_users ?? 0}
          hint="Users currently allowed to access Hearth."
        />
        <AdminStatCard
          label="Avg Confidence"
          value={`${analytics?.metrics.avg_confidence ?? 0}%`}
          hint="Average prediction confidence."
        />
        <AdminStatCard
          label="Success Rate"
          value={`${analytics?.metrics.success_rate ?? 0}%`}
          hint="Completed predictions over total predictions."
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="Total Screenings"
          value={analytics?.metrics.total_screenings ?? 0}
          hint="All uploaded voice samples."
        />
        <AdminStatCard
          label="Total Predictions"
          value={analytics?.metrics.total_predictions ?? 0}
          hint="All prediction records generated."
        />
        <AdminStatCard
          label="Avg Rule Score"
          value={analytics?.metrics.avg_rule_score ?? 0}
          hint="Average explainable scoring output."
        />
        <AdminStatCard
          label="Failed Predictions"
          value={analytics?.processing_distribution.failed ?? 0}
          hint="Predictions that failed processing."
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[28px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
          <h3 className="text-xl font-semibold">Risk Distribution</h3>
          <p className="mt-2 text-sm opacity-70">
            Low-risk versus high-risk prediction volume.
          </p>

          <div className="mt-6 h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskChartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  nameKey="name"
                  label
                >
                  <Cell />
                  <Cell />
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-[28px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
          <h3 className="text-xl font-semibold">Processing Status</h3>
          <p className="mt-2 text-sm opacity-70">
            Completed, failed, and pending prediction jobs.
          </p>

          <div className="mt-6 h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={processingChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" name="Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <h3 className="text-xl font-semibold">7-Day Screening Trend</h3>
        <p className="mt-2 text-sm opacity-70">
          Daily upload activity over the last seven days.
        </p>

        <div className="mt-6 h-[360px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="count" name="Uploads" strokeWidth={3} dot />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}