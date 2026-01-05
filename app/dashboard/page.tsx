"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Card from "@/components/ui/Card";
import DashboardHeader from "@/components/DashboardHeader";

interface Player {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  profileImageUrl?: string | null;
  injuryStatus?: string | null;
  team?: {
    id: string;
    name: string;
  } | null;
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
  team: {
    id: string;
    name: string;
  };
  stats: Array<{
    goals: number;
    assists: number;
    player: {
      id: string;
      firstName: string;
      lastName: string;
      profileImageUrl?: string | null;
    };
  }>;
}

export default function DashboardHome() {
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

  // Calculate player totals
  const getPlayerStats = (player: Player) => {
    return {
      assists: player.stats.reduce((sum, stat) => sum + (stat.assists || 0), 0),
      minutes: player.stats.reduce((sum, stat) => sum + (stat.minutes || 0), 0),
      goals: player.stats.reduce((sum, stat) => sum + (stat.goals || 0), 0),
    };
  };

  // Calculate dashboard stats
  const totalPlayers = players.length;
  const totalGames = matches.length;
  const totalGoals = players.reduce((sum, player) => sum + getPlayerStats(player).goals, 0);
  const totalOpponentGoals = 0; // Would need opponent goals data
  const goalDifference = totalGoals - totalOpponentGoals;
  
  // Calculate win rate (simplified - would need actual results)
  const wins = Math.floor(totalGames * 0.6); // Placeholder
  const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;
  
  // Attendance rate (placeholder)
  const attendanceRate = 85; // Would need actual attendance data
  
  // Active issues (injuries)
  const activeIssues = players.filter(p => p.injuryStatus && p.injuryStatus !== "FIT").length;
  
  // Top scorer
  const topScorer = [...players]
    .map((player) => ({ ...player, totalGoals: getPlayerStats(player).goals }))
    .sort((a, b) => b.totalGoals - a.totalGoals)[0];

  // Recent matches (last 5-6)
  const now = new Date();
  const recentMatches = [...matches]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6);

  // Top scorers
  const topScorers = [...players]
    .map((player) => ({ ...player, totalGoals: getPlayerStats(player).goals }))
    .sort((a, b) => b.totalGoals - a.totalGoals)
    .slice(0, 5);

  // Top assists
  const topAssists = [...players]
    .map((player) => ({ ...player, totalAssists: getPlayerStats(player).assists }))
    .sort((a, b) => b.totalAssists - a.totalAssists)
    .slice(0, 5);

  // Players with injuries
  const injuredPlayers = players.filter(p => p.injuryStatus && p.injuryStatus !== "FIT");

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const getPositionColor = (position: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      GK: { bg: "bg-[#FEF3C7]", text: "text-[#92400E]" },
      DF: { bg: "bg-[#DBEAFE]", text: "text-[#1E40AF]" },
      MF: { bg: "bg-[#D1FAE5]", text: "text-[#065F46]" },
      FW: { bg: "bg-[#FEE2E2]", text: "text-[#991B1B]" },
    };
    return colors[position] || { bg: "bg-[#F3F4F6]", text: "text-[#374151]" };
  };

  const getInjuryStatusColor = (status: string | null | undefined) => {
    const colors: Record<string, { bg: string; text: string }> = {
      QUESTIONABLE: { bg: "bg-[#FEF3C7]", text: "text-[#92400E]" },
      INJURED: { bg: "bg-[#FEE2E2]", text: "text-[#991B1B]" },
      RECOVERING: { bg: "bg-[#DBEAFE]", text: "text-[#1E40AF]" },
    };
    return colors[status || ""] || { bg: "bg-[#FEE2E2]", text: "text-[#991B1B]" };
  };

  if (loading) {
    return (
      <div className="max-w-[1600px]">
        <DashboardHeader />
        <div className="p-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#1A73E8] border-t-transparent"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px]">
      <DashboardHeader />

      <div className="p-6 space-y-6">
        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <Card className="p-4">
            <p className="text-xs text-[#6B7280] mb-1">Total Players</p>
            <p className="text-2xl font-semibold text-[#111827]">{totalPlayers}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-[#6B7280] mb-1">Total Games</p>
            <p className="text-2xl font-semibold text-[#111827]">{totalGames}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-[#6B7280] mb-1">Goal Difference</p>
            <p className={`text-2xl font-semibold ${goalDifference >= 0 ? "text-[#10B981]" : "text-[#EF4444]"}`}>
              {goalDifference >= 0 ? "+" : ""}{goalDifference}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-[#6B7280] mb-1">Attendance Rate</p>
            <p className="text-2xl font-semibold text-[#111827]">{attendanceRate}%</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-[#6B7280] mb-1">Total Goals</p>
            <p className="text-2xl font-semibold text-[#111827]">{totalGoals}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-[#6B7280] mb-1">Active Issues</p>
            <p className={`text-2xl font-semibold ${activeIssues > 0 ? "text-[#EF4444]" : "text-[#10B981]"}`}>
              {activeIssues}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-[#6B7280] mb-1">Win Rate</p>
            <p className="text-2xl font-semibold text-[#111827]">{winRate}%</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-[#6B7280] mb-1">Top Scorer</p>
            <p className="text-sm font-semibold text-[#111827] truncate">
              {topScorer ? `${topScorer.firstName} ${topScorer.lastName}` : "N/A"}
            </p>
            <p className="text-xs text-[#6B7280] mt-0.5">
              {topScorer ? `${getPlayerStats(topScorer).goals} goals` : ""}
            </p>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Games */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-base font-semibold text-[#111827] mb-1">Recent Games</h2>
                  <p className="text-xs text-[#6B7280]">Last 6 matches</p>
                </div>
                <Link href="/dashboard/matches" className="text-sm text-[#1A73E8] hover:underline">
                  View All
                </Link>
              </div>
              {recentMatches.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-[#9CA3AF]">No matches yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentMatches.map((match) => {
                    const teamGoals = match.stats.reduce((sum, stat) => sum + (stat.goals || 0), 0);
                    const isPast = new Date(match.date) < now;
                    return (
                      <Link
                        key={match.id}
                        href={`/dashboard/calendar`}
                        className="flex items-center justify-between p-3 rounded-lg border border-[#E5E7EB] hover:border-[#1A73E8] hover:bg-[#F9FAFB] transition-all group"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <p className="text-sm font-medium text-[#111827] group-hover:text-[#1A73E8] transition-colors">
                              {match.team.name}
                            </p>
                            <span className="text-[#9CA3AF]">vs</span>
                            <p className="text-sm font-medium text-[#111827]">{match.opponent}</p>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-[#6B7280]">
                            <span>{formatDate(match.date)}</span>
                            {isPast && (
                              <span className="font-medium text-[#111827]">{teamGoals} - 0</span>
                            )}
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <span className={`text-xs px-2 py-1 rounded ${isPast ? "bg-[#ECFDF5] text-[#065F46]" : "bg-[#EBF4FF] text-[#1E40AF]"}`}>
                            {isPast ? "Completed" : "Upcoming"}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Top Performers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Top Scorers */}
              <Card className="p-6">
                <div className="mb-6">
                  <h2 className="text-base font-semibold text-[#111827] mb-1">Top Scorers</h2>
                  <p className="text-xs text-[#6B7280]">Most goals this season</p>
                </div>
                {topScorers.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-sm text-[#9CA3AF]">No data available</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {topScorers.map((player, index) => {
                      const stats = getPlayerStats(player);
                      return (
                        <Link
                          key={player.id}
                          href={`/dashboard/players/${player.id}`}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#F9FAFB] transition-colors group"
                        >
                          <div className="flex-shrink-0 w-6 text-sm font-semibold text-[#6B7280]">
                            {index + 1}
                          </div>
                          <div className="flex-shrink-0 relative w-10 h-10 rounded-full overflow-hidden border border-[#E5E7EB]">
                            {player.profileImageUrl ? (
                              <Image
                                src={player.profileImageUrl}
                                alt={`${player.firstName} ${player.lastName}`}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-[#EBF4FF] flex items-center justify-center text-[#1A73E8] text-sm font-semibold">
                                {player.firstName.charAt(0)}{player.lastName.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[#111827] truncate group-hover:text-[#1A73E8] transition-colors">
                              {player.firstName} {player.lastName}
                            </p>
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <p className="text-base font-semibold text-[#111827]">{stats.goals}</p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </Card>

              {/* Top Assists */}
              <Card className="p-6">
                <div className="mb-6">
                  <h2 className="text-base font-semibold text-[#111827] mb-1">Top Assists</h2>
                  <p className="text-xs text-[#6B7280]">Most assists this season</p>
                </div>
                {topAssists.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-sm text-[#9CA3AF]">No data available</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {topAssists.map((player, index) => {
                      const stats = getPlayerStats(player);
                      return (
                        <Link
                          key={player.id}
                          href={`/dashboard/players/${player.id}`}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#F9FAFB] transition-colors group"
                        >
                          <div className="flex-shrink-0 w-6 text-sm font-semibold text-[#6B7280]">
                            {index + 1}
                          </div>
                          <div className="flex-shrink-0 relative w-10 h-10 rounded-full overflow-hidden border border-[#E5E7EB]">
                            {player.profileImageUrl ? (
                              <Image
                                src={player.profileImageUrl}
                                alt={`${player.firstName} ${player.lastName}`}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-[#EBF4FF] flex items-center justify-center text-[#1A73E8] text-sm font-semibold">
                                {player.firstName.charAt(0)}{player.lastName.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[#111827] truncate group-hover:text-[#1A73E8] transition-colors">
                              {player.firstName} {player.lastName}
                            </p>
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <p className="text-base font-semibold text-[#111827]">{stats.assists}</p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </Card>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Injury & Wellness */}
            <Card className="p-6">
              <div className="mb-6">
                <h2 className="text-base font-semibold text-[#111827] mb-1">Injury & Wellness</h2>
                <p className="text-xs text-[#6B7280]">Current issues</p>
              </div>
              {injuredPlayers.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-[#10B981] font-medium">All players fit</p>
                  <p className="text-xs text-[#6B7280] mt-2">No active injuries</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {injuredPlayers.map((player) => {
                    const injuryColors = getInjuryStatusColor(player.injuryStatus);
                    return (
                      <Link
                        key={player.id}
                        href={`/dashboard/players/${player.id}`}
                        className="flex items-center gap-3 p-3 rounded-lg border border-[#E5E7EB] hover:border-[#1A73E8] hover:bg-[#F9FAFB] transition-all group"
                      >
                        <div className="flex-shrink-0 relative w-10 h-10 rounded-full overflow-hidden border border-[#E5E7EB]">
                          {player.profileImageUrl ? (
                            <Image
                              src={player.profileImageUrl}
                              alt={`${player.firstName} ${player.lastName}`}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-[#EBF4FF] flex items-center justify-center text-[#1A73E8] text-sm font-semibold">
                              {player.firstName.charAt(0)}{player.lastName.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#111827] truncate group-hover:text-[#1A73E8] transition-colors">
                            {player.firstName} {player.lastName}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${injuryColors.bg} ${injuryColors.text}`}>
                              {player.injuryStatus}
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Quick Actions */}
            <Card className="p-6">
              <div className="mb-6">
                <h2 className="text-base font-semibold text-[#111827] mb-1">Quick Actions</h2>
                <p className="text-xs text-[#6B7280]">Common tasks</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/dashboard/players"
                  className="p-3 rounded-lg border border-[#E5E7EB] hover:border-[#1A73E8] hover:bg-[#F9FAFB] transition-all text-center group"
                >
                  <p className="text-sm font-medium text-[#111827] group-hover:text-[#1A73E8] transition-colors">Players</p>
                </Link>
                <Link
                  href="/dashboard/games/create"
                  className="p-3 rounded-lg border border-[#E5E7EB] hover:border-[#1A73E8] hover:bg-[#F9FAFB] transition-all text-center group"
                >
                  <p className="text-sm font-medium text-[#111827] group-hover:text-[#1A73E8] transition-colors">Games</p>
                </Link>
                <Link
                  href="/dashboard/training"
                  className="p-3 rounded-lg border border-[#E5E7EB] hover:border-[#1A73E8] hover:bg-[#F9FAFB] transition-all text-center group"
                >
                  <p className="text-sm font-medium text-[#111827] group-hover:text-[#1A73E8] transition-colors">Training</p>
                </Link>
                <Link
                  href="/dashboard/tournaments"
                  className="p-3 rounded-lg border border-[#E5E7EB] hover:border-[#1A73E8] hover:bg-[#F9FAFB] transition-all text-center group"
                >
                  <p className="text-sm font-medium text-[#111827] group-hover:text-[#1A73E8] transition-colors">Tournaments</p>
                </Link>
                <Link
                  href="/dashboard/stats"
                  className="p-3 rounded-lg border border-[#E5E7EB] hover:border-[#1A73E8] hover:bg-[#F9FAFB] transition-all text-center group"
                >
                  <p className="text-sm font-medium text-[#111827] group-hover:text-[#1A73E8] transition-colors">Stats</p>
                </Link>
                <Link
                  href="/dashboard/analytics"
                  className="p-3 rounded-lg border border-[#E5E7EB] hover:border-[#1A73E8] hover:bg-[#F9FAFB] transition-all text-center group"
                >
                  <p className="text-sm font-medium text-[#111827] group-hover:text-[#1A73E8] transition-colors">Analytics</p>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
