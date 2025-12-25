/**
 * Dashboard - Analytics et statistiques
 */

"use client";

import { useEffect, useState } from "react";
import { BarChart3, MessageSquare, ThumbsUp, BookOpen, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import type { AnalyticsResponse } from "@/types/api";

function StatCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <Card className="border-zinc-800 bg-zinc-900/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-zinc-400">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const data = await api.getAnalytics(30);
        setAnalytics(data);
      } catch (err) {
        setError("Impossible de charger les analytics. Vérifiez votre clé API.");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <BarChart3 className="mb-4 h-12 w-12 text-zinc-600" />
        <h2 className="mb-2 text-xl font-semibold">Analytics indisponibles</h2>
        <p className="text-zinc-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-zinc-400">Statistiques des 30 derniers jours</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Conversations"
            value={analytics?.total_conversations || 0}
            icon={MessageSquare}
            color="text-indigo-400"
          />
          <StatCard
            title="Feedbacks"
            value={analytics?.total_feedbacks || 0}
            icon={ThumbsUp}
            color="text-green-400"
          />
          <StatCard
            title="Score Moyen"
            value={analytics?.average_score?.toFixed(1) || "N/A"}
            icon={BarChart3}
            color="text-violet-400"
          />
          <StatCard
            title="En attente"
            value={analytics?.pending_training || 0}
            icon={BookOpen}
            color="text-amber-400"
          />
        </div>

        {/* Score Distribution */}
        {analytics?.score_distribution && (
          <Card className="mt-8 border-zinc-800 bg-zinc-900/50">
            <CardHeader>
              <CardTitle>Distribution des scores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex h-32 items-end gap-2">
                {[1, 2, 3, 4, 5].map((score) => {
                  const count = analytics.score_distribution[score.toString()] || 0;
                  const maxCount = Math.max(
                    ...Object.values(analytics.score_distribution)
                  );
                  const height = maxCount > 0 ? (count / maxCount) * 100 : 0;

                  return (
                    <div key={score} className="flex flex-1 flex-col items-center gap-2">
                      <div
                        className="w-full rounded-t bg-gradient-to-t from-indigo-600 to-violet-600"
                        style={{ height: `${height}%`, minHeight: count > 0 ? "8px" : "0" }}
                      />
                      <span className="text-sm text-zinc-400">{score}★</span>
                      <span className="text-xs text-zinc-500">{count}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
