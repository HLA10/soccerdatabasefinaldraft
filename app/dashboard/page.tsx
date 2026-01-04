"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Card from "@/components/ui/Card";

interface Player {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  profileImageUrl?: string | null;
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

  // Top 5 assists
  const topAssists = [...players]
    .map((player) => ({ ...player, totalAssists: getPlayerStats(player).assists }))
    .sort((a, b) => b.totalAssists - a.totalAssists)
    .slice(0, 5);

  // Top 5 minutes played
  const topMinutes = [...players]
    .map((player) => ({ ...player, totalMinutes: getPlayerStats(player).minutes }))
    .sort((a, b) => b.totalMinutes - a.totalMinutes)
    .slice(0, 5);

  // Upcoming matches (next 3-5)
  const now = new Date();
  const upcomingMatches = [...matches]
    .filter((match) => new Date(match.date) >= now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  // Previous match (most recent past match)
  const previousMatch = [...matches]
    .filter((match) => new Date(match.date) < now)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      time: date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      full: date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
    };
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

  if (loading) {
    return (
      <div className="max-w-[1400px]">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-[#111827] mb-1">Dashboard</h1>
          <p className="text-sm text-[#6B7280]">Loading dashboard data...</p>
        </div>
        <Card className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#1A73E8] border-t-transparent mx-auto mb-4"></div>
          <p className="text-sm text-[#6B7280]">Loading...</p>
        </Card>
      </div>
    );
  }

  // Calculate team goals for previous match
  const getTeamGoals = (match: Match) => {
    return match.stats.reduce((sum, stat) => sum + (stat.goals || 0), 0);
  };

  // Get standout players (top scorers) from previous match
  const getStandoutPlayers = (match: Match) => {
    return [...match.stats]
      .filter((stat) => stat.goals > 0)
      .sort((a, b) => b.goals - a.goals)
      .slice(0, 3);
  };

  return (
    <div className="max-w-[1400px]">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#111827] mb-1">Dashboard</h1>
        <p className="text-sm text-[#6B7280]">Overview of your club performance and upcoming events</p>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Top Assists */}
        <Card className="lg:col-span-1">
          <div className="mb-6">
            <h2 className="text-base font-semibold text-[#111827] mb-1">Top Assists</h2>
            <p className="text-xs text-[#6B7280]">Players with most assists this season</p>
          </div>
          {topAssists.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-[#9CA3AF]">No assist data available</p>
            </div>
          ) : (
            <div className="space-y-3">
              {topAssists.map((player, index) => {
                const positionColors = getPositionColor(player.position);
                const stats = getPlayerStats(player);
                return (
                  <Link
                    key={player.id}
                    href={`/dashboard/players/${player.id}`}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#F9FAFB] transition-colors group"
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
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-medium text-[#111827] truncate group-hover:text-[#1A73E8] transition-colors">
                          {player.firstName} {player.lastName}
                        </p>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${positionColors.bg} ${positionColors.text}`}>
                          {player.position}
                        </span>
                      </div>
                      {player.team && (
                        <p className="text-xs text-[#6B7280] truncate">{player.team.name}</p>
                      )}
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-base font-semibold text-[#111827]">{stats.assists}</p>
                      <p className="text-[10px] text-[#9CA3AF]">assists</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </Card>

        {/* Most Minutes Played */}
        <Card className="lg:col-span-1">
          <div className="mb-6">
            <h2 className="text-base font-semibold text-[#111827] mb-1">Most Minutes Played</h2>
            <p className="text-xs text-[#6B7280]">Players with most playing time</p>
          </div>
          {topMinutes.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-[#9CA3AF]">No minutes data available</p>
            </div>
          ) : (
            <div className="space-y-3">
              {topMinutes.map((player) => {
                const positionColors = getPositionColor(player.position);
                const stats = getPlayerStats(player);
                const minutesFormatted = Math.round(stats.minutes / 90) > 0
                  ? `${Math.round(stats.minutes / 90)} games`
                  : `${stats.minutes} min`;
                return (
                  <Link
                    key={player.id}
                    href={`/dashboard/players/${player.id}`}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#F9FAFB] transition-colors group"
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
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-medium text-[#111827] truncate group-hover:text-[#1A73E8] transition-colors">
                          {player.firstName} {player.lastName}
                        </p>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${positionColors.bg} ${positionColors.text}`}>
                          {player.position}
                        </span>
                      </div>
                      {player.team && (
                        <p className="text-xs text-[#6B7280] truncate">{player.team.name}</p>
                      )}
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-base font-semibold text-[#111827]">{stats.minutes}</p>
                      <p className="text-[10px] text-[#9CA3AF]">minutes</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </Card>

        {/* Upcoming Games */}
        <Card className="lg:col-span-1">
          <div className="mb-6">
            <h2 className="text-base font-semibold text-[#111827] mb-1">Upcoming Games</h2>
            <p className="text-xs text-[#6B7280]">Next scheduled matches</p>
          </div>
          {upcomingMatches.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-[#9CA3AF]">No upcoming matches</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingMatches.map((match) => {
                const dateInfo = formatDate(match.date);
                return (
                  <Link
                    key={match.id}
                    href={`/dashboard/calendar`}
                    className="block p-3 rounded-lg border border-[#E5E7EB] hover:border-[#1A73E8] hover:bg-[#F9FAFB] transition-all group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#111827] mb-1 group-hover:text-[#1A73E8] transition-colors">
                          vs {match.opponent}
                        </p>
                        <p className="text-xs text-[#6B7280]">{match.team.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#6B7280]">
                      <span>{dateInfo.full}</span>
                      <span>•</span>
                      <span>{dateInfo.time}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </Card>

        {/* Previous Game */}
        <Card className="lg:col-span-2 xl:col-span-3">
          <div className="mb-6">
            <h2 className="text-base font-semibold text-[#111827] mb-1">Previous Game</h2>
            <p className="text-xs text-[#6B7280]">Most recent match result</p>
          </div>
          {!previousMatch ? (
            <div className="py-12 text-center">
              <p className="text-sm text-[#9CA3AF]">No previous matches</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Match Result */}
              <div className="flex items-center justify-between p-4 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB]">
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#6B7280] mb-2">
                    {previousMatch.team.name}
                  </p>
                  <div className="flex items-baseline gap-3">
                    <p className="text-3xl font-bold text-[#111827]">{getTeamGoals(previousMatch)}</p>
                    <p className="text-lg text-[#6B7280]">-</p>
                    <p className="text-sm text-[#6B7280]">{previousMatch.opponent}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-[#111827] mb-1">
                    {formatDate(previousMatch.date).full}
                  </p>
                  <p className="text-xs text-[#6B7280]">{formatDate(previousMatch.date).time}</p>
                </div>
              </div>

              {/* Standout Players */}
              {getStandoutPlayers(previousMatch).length > 0 && (
                <div>
                  <p className="text-xs font-medium text-[#6B7280] mb-3 uppercase tracking-wide">
                    Key Performers
                  </p>
                  <div className="flex items-center gap-3">
                    {getStandoutPlayers(previousMatch).map((stat) => (
                      <Link
                        key={stat.player.id}
                        href={`/dashboard/players/${stat.player.id}`}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-[#F9FAFB] transition-colors group"
                      >
                        <div className="relative w-10 h-10 rounded-full overflow-hidden border border-[#E5E7EB]">
                          {stat.player.profileImageUrl ? (
                            <Image
                              src={stat.player.profileImageUrl}
                              alt={`${stat.player.firstName} ${stat.player.lastName}`}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-[#EBF4FF] flex items-center justify-center text-[#1A73E8] text-sm font-semibold">
                              {stat.player.firstName.charAt(0)}{stat.player.lastName.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#111827] group-hover:text-[#1A73E8] transition-colors">
                            {stat.player.firstName} {stat.player.lastName}
                          </p>
                          <p className="text-xs text-[#6B7280]">
                            {stat.goals} {stat.goals === 1 ? "goal" : "goals"}
                            {stat.assists > 0 && ` • ${stat.assists} assist${stat.assists === 1 ? "" : "s"}`}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Placeholder: Team Form */}
        <Card className="lg:col-span-1">
          <div className="mb-6">
            <h2 className="text-base font-semibold text-[#111827] mb-1">Team Form</h2>
            <p className="text-xs text-[#6B7280]">Last 5 matches</p>
          </div>
          <div className="py-8 text-center">
            <p className="text-sm text-[#9CA3AF]">Coming soon</p>
          </div>
        </Card>

        {/* Placeholder: Injury Summary */}
        <Card className="lg:col-span-1">
          <div className="mb-6">
            <h2 className="text-base font-semibold text-[#111827] mb-1">Injury Summary</h2>
            <p className="text-xs text-[#6B7280]">Current injury status</p>
          </div>
          <div className="py-8 text-center">
            <p className="text-sm text-[#9CA3AF]">Coming soon</p>
          </div>
        </Card>

        {/* Placeholder: Training Attendance */}
        <Card className="lg:col-span-1">
          <div className="mb-6">
            <h2 className="text-base font-semibold text-[#111827] mb-1">Training Attendance</h2>
            <p className="text-xs text-[#6B7280]">Recent training sessions</p>
          </div>
          <div className="py-8 text-center">
            <p className="text-sm text-[#9CA3AF]">Coming soon</p>
          </div>
        </Card>
      </div>
    </div>
  );
}