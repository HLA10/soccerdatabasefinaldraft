"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import StatWidget from "@/components/ui/StatWidget";

interface Player {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  stats: Array<{
    goals: number;
    assists: number;
    minutes: number;
    rating?: number | null;
  }>;
}

interface Match {
  id: string;
  date: string;
  opponent: string;
  stats: Array<{
    goals: number;
    assists: number;
  }>;
}

export default function AnalyticsPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/players").then((res) => res.json()),
      fetch("/api/matches").then((res) => res.json()),
    ])
      .then(([playersData, matchesData]) => {
        setPlayers(playersData || []);
        setMatches(matchesData || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const getPlayerStats = (player: Player) => {
    return {
      assists: player.stats.reduce((sum, stat) => sum + (stat.assists || 0), 0),
      minutes: player.stats.reduce((sum, stat) => sum + (stat.minutes || 0), 0),
      goals: player.stats.reduce((sum, stat) => sum + (stat.goals || 0), 0),
      rating: player.stats.length > 0
        ? player.stats.reduce((sum, stat) => sum + (stat.rating || 0), 0) / player.stats.length
        : 0,
    };
  };

  // Calculate analytics
  const totalGoals = players.reduce((sum, player) => sum + getPlayerStats(player).goals, 0);
  const totalAssists = players.reduce((sum, player) => sum + getPlayerStats(player).assists, 0);
  const totalMatches = matches.length;
  const goalsPerMatch = totalMatches > 0 ? (totalGoals / totalMatches).toFixed(2) : "0.00";
  const assistsPerMatch = totalMatches > 0 ? (totalAssists / totalMatches).toFixed(2) : "0.00";
  
  // Position distribution
  const positionCounts = players.reduce((acc, player) => {
    acc[player.position] = (acc[player.position] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Performance trends (simplified)
  const recentMatches = [...matches]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Analytics"
          description="Team performance analytics and insights"
        />
        <Card className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#1A73E8] border-t-transparent mx-auto mb-4"></div>
          <p className="text-sm text-[#6B7280]">Loading analytics...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Team performance analytics and insights"
      />

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatWidget
          label="Total Goals"
          value={totalGoals.toString()}
        />
        <StatWidget
          label="Total Assists"
          value={totalAssists.toString()}
        />
        <StatWidget
          label="Goals per Match"
          value={goalsPerMatch}
        />
        <StatWidget
          label="Assists per Match"
          value={assistsPerMatch}
        />
      </div>

      {/* Position Distribution */}
      <Card className="p-6">
        <h2 className="text-base font-semibold text-[#111827] mb-4">Position Distribution</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(positionCounts).map(([position, count]) => (
            <div key={position} className="text-center">
              <p className="text-2xl font-semibold text-[#111827]">{count}</p>
              <p className="text-sm text-[#6B7280]">{position}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Recent Matches Performance */}
      <Card className="p-6">
        <h2 className="text-base font-semibold text-[#111827] mb-4">Recent Matches</h2>
        {recentMatches.length === 0 ? (
          <p className="text-sm text-[#6B7280]">No matches available</p>
        ) : (
          <div className="space-y-3">
            {recentMatches.map((match) => {
              const matchGoals = match.stats.reduce((sum, stat) => sum + (stat.goals || 0), 0);
              const matchAssists = match.stats.reduce((sum, stat) => sum + (stat.assists || 0), 0);
              return (
                <div key={match.id} className="flex items-center justify-between p-3 rounded-lg border border-[#E5E7EB]">
                  <div>
                    <p className="text-sm font-medium text-[#111827]">
                      vs {match.opponent}
                    </p>
                    <p className="text-xs text-[#6B7280]">
                      {new Date(match.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-[#111827]">{matchGoals} goals</p>
                      <p className="text-xs text-[#6B7280]">{matchAssists} assists</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
