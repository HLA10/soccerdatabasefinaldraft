"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

interface Team {
  id: string;
  name: string;
  logoUrl?: string | null;
  club?: {
    id: string;
    name: string;
    logoUrl?: string | null;
  } | null;
}

interface Game {
  id: string;
  date: string;
  time?: string | null;
  opponent?: string | null;
  opponentName?: string | null;
  opponentLogoUrl?: string | null;
  homeTeam?: {
    id: string;
    name: string;
    logoUrl?: string | null;
    club?: {
      id: string;
      name: string;
      logoUrl?: string | null;
    } | null;
  } | null;
  awayTeam?: {
    id: string;
    name: string;
    logoUrl?: string | null;
    club?: {
      id: string;
      name: string;
      logoUrl?: string | null;
    } | null;
  } | null;
  team?: {
    id: string;
    name: string;
    logoUrl?: string | null;
    club?: {
      id: string;
      name: string;
      logoUrl?: string | null;
    } | null;
  } | null;
  venue?: string | null;
  venueName?: string | null;
}

export default function GamesMobilePage() {
  const router = useRouter();
  const [team, setTeam] = useState<Team | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  useEffect(() => {
    // Fetch user's team
    fetch("/api/teams")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.length > 0) {
          setTeam(data[0]);
        }
      })
      .catch(() => {});

    // Fetch games
    fetch("/api/games")
      .then((res) => res.json())
      .then((data) => {
        setGames(data || []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (timeString: string | null | undefined) => {
    if (!timeString) return "";
    try {
      const [hours, minutes] = timeString.split(":");
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? "PM" : "AM";
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch {
      return timeString;
    }
  };

  const formatFullDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  // Group games by date
  const gamesByDate = games.reduce((acc, game) => {
    const dateKey = game.date.split("T")[0];
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(game);
    return acc;
  }, {} as Record<string, Game[]>);

  // Get all unique dates and sort them
  const sortedDates = Object.keys(gamesByDate).sort();

  // Filter games for selected month
  const monthStart = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
  const monthEnd = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);
  
  const filteredGames = sortedDates
    .filter((dateKey) => {
      const date = new Date(dateKey);
      return date >= monthStart && date <= monthEnd;
    })
    .map((dateKey) => ({
      date: dateKey,
      games: gamesByDate[dateKey],
    }));

  const teamLogo = team?.logoUrl || team?.club?.logoUrl || null;

  const navigateMonth = (direction: "prev" | "next") => {
    setSelectedMonth((prev) => {
      const newDate = new Date(prev);
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const monthName = selectedMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#1A73E8] border-t-transparent mx-auto mb-4"></div>
          <p className="text-sm text-[#6B7280]">Loading games...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white -mx-4 lg:-mx-6 -mt-8">
      {/* Team Header */}
      <div className="bg-white border-b border-[#E5E7EB] sticky top-0 z-10">
        <div className="px-4 lg:px-6 py-4 flex items-center gap-3">
          <Link href="/dashboard/matches" className="lg:hidden flex-shrink-0">
            <button className="p-2 text-[#6B7280] hover:text-[#111827] hover:bg-[#F9FAFB] rounded-lg transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </Link>
          {teamLogo ? (
            <div className="relative w-12 h-12 flex-shrink-0">
              <Image
                src={teamLogo}
                alt={team?.name || "Team logo"}
                fill
                className="object-contain rounded"
              />
            </div>
          ) : (
            <div className="w-12 h-12 bg-[#E5E7EB] rounded flex items-center justify-center flex-shrink-0">
              <span className="text-lg font-bold text-[#6B7280]">
                {team?.name?.charAt(0).toUpperCase() || "T"}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-[#111827] truncate">
              {team?.name || "My Team"}
            </h1>
            <p className="text-xs text-[#6B7280]">Games & Events</p>
          </div>
        </div>
      </div>

      {/* Month Navigation */}
      <div className="bg-white border-b border-[#E5E7EB] px-4 lg:px-6 py-3 flex items-center justify-between">
        <button
          onClick={() => navigateMonth("prev")}
          className="p-2 text-[#6B7280] hover:text-[#111827] hover:bg-[#F9FAFB] rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-base font-semibold text-[#111827]">{monthName}</h2>
        <button
          onClick={() => navigateMonth("next")}
          className="p-2 text-[#6B7280] hover:text-[#111827] hover:bg-[#F9FAFB] rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Games List */}
      <div className="pb-6">
        {filteredGames.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="text-sm text-[#6B7280]">No games scheduled for this month</p>
          </div>
        ) : (
          <div className="space-y-4 px-4 lg:px-6 pt-4">
            {filteredGames.map(({ date, games: dateGames }) => (
              <div key={date} className="space-y-3">
                {/* Date Header */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-px flex-1 bg-[#E5E7EB]"></div>
                  <span className="text-sm font-semibold text-[#111827] px-2">
                    {formatFullDate(date)}
                  </span>
                  <div className="h-px flex-1 bg-[#E5E7EB]"></div>
                </div>

                {/* Games for this date */}
                {dateGames.map((game) => {
                  // Determine home and away teams
                  const isHomeGame = game.homeTeam?.id === team?.id || game.team?.id === team?.id;
                  const homeTeam = game.homeTeam || game.team;
                  const awayTeam = game.awayTeam;
                  
                  const opponentName = isHomeGame
                    ? (awayTeam?.name || game.opponentName || game.opponent || "Opponent")
                    : (homeTeam?.name || "Opponent");
                  
                  const opponentLogo = isHomeGame
                    ? (awayTeam?.club?.logoUrl || awayTeam?.logoUrl || game.opponentLogoUrl || null)
                    : (homeTeam?.club?.logoUrl || homeTeam?.logoUrl || null);

                  return (
                    <Link
                      key={game.id}
                      href={`/dashboard/games/${game.id}/squad`}
                      className="block bg-white border border-[#E5E7EB] rounded-lg p-4 hover:border-[#1A73E8] hover:bg-[#F9FAFB] transition-all active:bg-[#EBF4FF]"
                    >
                      <div className="flex items-center gap-4">
                        {/* Date/Time Column */}
                        <div className="flex-shrink-0 text-center min-w-[60px]">
                          <div className="text-xs font-medium text-[#6B7280] mb-1">
                            {formatDate(game.date)}
                          </div>
                          {game.time && (
                            <div className="text-xs font-semibold text-[#111827]">
                              {formatTime(game.time)}
                            </div>
                          )}
                        </div>

                        {/* VS Column */}
                        <div className="flex-1 flex items-center gap-3">
                          {/* Team Logo */}
                          {teamLogo && (
                            <div className="relative w-10 h-10 flex-shrink-0">
                              <Image
                                src={teamLogo}
                                alt={team?.name || "Team"}
                                fill
                                className="object-contain rounded"
                              />
                            </div>
                          )}

                          {/* VS Text */}
                          <div className="flex-1 text-center">
                            <div className="text-xs font-medium text-[#6B7280] mb-1">vs</div>
                            <div className="text-sm font-semibold text-[#111827] truncate">
                              {opponentName}
                            </div>
                            {game.venueName && (
                              <div className="text-xs text-[#6B7280] truncate mt-1">
                                {game.venueName}
                              </div>
                            )}
                          </div>

                          {/* Opponent Logo */}
                          {opponentLogo ? (
                            <div className="relative w-10 h-10 flex-shrink-0">
                              <Image
                                src={opponentLogo}
                                alt={opponentName}
                                fill
                                className="object-contain rounded"
                              />
                            </div>
                          ) : (
                            <div className="w-10 h-10 bg-[#E5E7EB] rounded flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-bold text-[#6B7280]">
                                {opponentName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Arrow Icon */}
                        <div className="flex-shrink-0 text-[#6B7280]">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
