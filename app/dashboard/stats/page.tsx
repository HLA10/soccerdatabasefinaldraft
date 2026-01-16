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
    player: {
      id: string;
      firstName: string;
      lastName: string;
    };
  }>;
}

export default function StatsPage() {
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

  // Calculate overall stats
  const totalPlayers = players.length;
  const totalMatches = matches.length;
  const totalGoals = players.reduce((sum, player) => sum + getPlayerStats(player).goals, 0);
  const totalAssists = players.reduce((sum, player) => sum + getPlayerStats(player).assists, 0);
  const totalMinutes = players.reduce((sum, player) => sum + getPlayerStats(player).minutes, 0);
  const avgRating = players.length > 0
    ? players.reduce((sum, player) => sum + getPlayerStats(player).rating, 0) / players.length
    : 0;

  // Top performers
  const topScorers = [...players]
    .map((player) => ({ ...player, totalGoals: getPlayerStats(player).goals }))
    .sort((a, b) => b.totalGoals - a.totalGoals)
    .slice(0, 5);

  const topAssisters = [...players]
    .map((player) => ({ ...player, totalAssists: getPlayerStats(player).assists }))
    .sort((a, b) => b.totalAssists - a.totalAssists)
    .slice(0, 5);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Statistics"
          description="View team and player statistics"
        />
        <Card className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#1A73E8] border-t-transparent mx-auto mb-4"></div>
          <p className="text-sm text-[#6B7280]">Loading statistics...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Statistics"
        description="View team and player statistics"
      />

      {/* Overall Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatWidget
          label="Total Players"
          value={totalPlayers.toString()}
        />
        <StatWidget
          label="Total Matches"
          value={totalMatches.toString()}
        />
        <StatWidget
          label="Total Goals"
          value={totalGoals.toString()}
        />
        <StatWidget
          label="Total Assists"
          value={totalAssists.toString()}
        />
        <StatWidget
          label="Total Minutes"
          value={totalMinutes.toString()}
        />
        <StatWidget
          label="Avg Rating"
          value={avgRating.toFixed(1)}
        />
      </div>

      {/* Top Performers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Scorers */}
        <Card className="p-6">
          <h2 className="text-base font-semibold text-[#111827] mb-4">Top Scorers</h2>
          {topScorers.length === 0 ? (
            <p className="text-sm text-[#6B7280]">No data available</p>
          ) : (
            <div className="space-y-3">
              {topScorers.map((player, index) => (
                <div key={player.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-[#6B7280] w-6">{index + 1}</span>
                    <span className="text-sm font-medium text-[#111827]">
                      {player.firstName} {player.lastName}
                    </span>
                  </div>
                  <span className="text-base font-semibold text-[#111827]">
                    {getPlayerStats(player).goals} goals
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Top Assisters */}
        <Card className="p-6">
          <h2 className="text-base font-semibold text-[#111827] mb-4">Top Assisters</h2>
          {topAssisters.length === 0 ? (
            <p className="text-sm text-[#6B7280]">No data available</p>
          ) : (
            <div className="space-y-3">
              {topAssisters.map((player, index) => (
                <div key={player.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-[#6B7280] w-6">{index + 1}</span>
                    <span className="text-sm font-medium text-[#111827]">
                      {player.firstName} {player.lastName}
                    </span>
                  </div>
                  <span className="text-base font-semibold text-[#111827]">
                    {getPlayerStats(player).assists} assists
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
