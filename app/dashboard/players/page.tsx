"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";
import DataTable from "@/components/ui/DataTable";

interface Player {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  profileImageUrl?: string | null;
  dateOfBirth?: string | null;
  injuryStatus?: string | null;
  team: {
    id: string;
    name: string;
  } | null;
  stats: any[];
}

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/players")
      .then((res) => res.json())
      .then((data) => {
        setPlayers(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const getTotalGoals = (stats: any[]) => {
    return stats.reduce((sum, stat) => sum + (stat.goals || 0), 0);
  };

  const getTotalAssists = (stats: any[]) => {
    return stats.reduce((sum, stat) => sum + (stat.assists || 0), 0);
  };

  const getTotalMinutes = (stats: any[]) => {
    return stats.reduce((sum, stat) => sum + (stat.minutes || 0), 0);
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
    const colors: Record<string, { bg: string; text: string; label: string }> = {
      FIT: { bg: "bg-[#D1FAE5]", text: "text-[#065F46]", label: "Fit" },
      QUESTIONABLE: { bg: "bg-[#FEF3C7]", text: "text-[#92400E]", label: "Questionable" },
      INJURED: { bg: "bg-[#FEE2E2]", text: "text-[#991B1B]", label: "Injured" },
      RECOVERING: { bg: "bg-[#DBEAFE]", text: "text-[#1E40AF]", label: "Recovering" },
    };
    return colors[status || "FIT"] || colors.FIT;
  };

  if (loading) {
    return (
      <div className="max-w-7xl">
        <PageHeader
          title="Players"
          description="View and manage all players across teams"
        />
        <Card className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#1A73E8] border-t-transparent mx-auto mb-4"></div>
          <p className="text-sm text-[#6B7280]">Loading players...</p>
        </Card>
      </div>
    );
  }

  const tableColumns = [
    {
      key: "name",
      header: "Player Name",
      sortable: true,
      render: (player: Player) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#EBF4FF] rounded-lg flex items-center justify-center text-[#1A73E8] font-semibold text-sm">
            {player.firstName.charAt(0)}{player.lastName.charAt(0)}
          </div>
          <span className="font-medium text-[#111827]">
            {player.firstName} {player.lastName}
          </span>
        </div>
      ),
    },
    {
      key: "position",
      header: "Position",
      sortable: true,
      render: (player: Player) => {
        const colors = getPositionColor(player.position);
        return (
          <span
            className={`px-2.5 py-1 rounded-md text-xs font-medium ${colors.bg} ${colors.text}`}
          >
            {player.position}
          </span>
        );
      },
    },
    {
      key: "team",
      header: "Team",
      sortable: true,
      render: (player: Player) => (
        <span className="text-[#6B7280]">
          {player.team ? player.team.name : "No team"}
        </span>
      ),
    },
    {
      key: "goals",
      header: "Goals",
      sortable: true,
      render: (player: Player) => (
        <span className="font-medium text-[#111827]">
          {getTotalGoals(player.stats)}
        </span>
      ),
    },
  ];

  return (
    <div className="max-w-7xl">
      <PageHeader
        title="Players"
        description="View and manage all players across teams"
        action={
          <Link href="/dashboard/players/create">
            <Button>Add Player</Button>
          </Link>
        }
      />

          {players.length === 0 ? (
            <Card className="text-center py-12 px-6">
              <h3 className="text-lg font-semibold mb-2 text-[#111827]">No players yet</h3>
              <p className="text-sm text-[#6B7280] mb-6">Add your first player to get started!</p>
              <Link href="/dashboard/players/create">
                <Button>Add Your First Player</Button>
              </Link>
            </Card>
          ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {players.map((player) => {
            const goals = getTotalGoals(player.stats);
            const assists = getTotalAssists(player.stats);
            const minutes = getTotalMinutes(player.stats);
            const positionColors = getPositionColor(player.position);
            const injuryStatus = getInjuryStatusColor(player.injuryStatus);

            return (
              <Link key={player.id} href={`/dashboard/players/${player.id}`}>
                <Card hover className="cursor-pointer">
                  {/* Profile Image */}
                  <div className="flex justify-center mb-4">
                    <div className="relative">
                      {player.profileImageUrl ? (
                        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg">
                          <img
                            src={player.profileImageUrl}
                            alt={`${player.firstName} ${player.lastName}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#1A73E8] to-[#1557B0] flex items-center justify-center text-white text-2xl font-bold shadow-lg border-4 border-white">
                          {player.firstName.charAt(0)}{player.lastName.charAt(0)}
                        </div>
                      )}
                      {/* Injury Status Badge */}
                      {player.injuryStatus && player.injuryStatus !== "FIT" && (
                        <div className={`absolute -bottom-1 -right-1 w-6 h-6 ${injuryStatus.bg} rounded-full border-2 border-white flex items-center justify-center`} title={injuryStatus.label}>
                          <div className={`w-2 h-2 rounded-full ${injuryStatus.text.replace('text-', 'bg-')}`}></div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Player Name */}
                  <h3 className="text-center font-semibold text-lg text-[#111827] mb-1">
                    {player.firstName} {player.lastName}
                  </h3>

                  {/* Position */}
                  <div className="flex justify-center mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${positionColors.bg} ${positionColors.text}`}>
                      {player.position}
                    </span>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-2 pt-4 border-t border-[#E5E7EB]">
                    <div className="text-center">
                      <p className="text-xs text-[#6B7280] mb-1">Goals</p>
                      <p className="text-sm font-semibold text-[#111827]">{goals}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-[#6B7280] mb-1">Assists</p>
                      <p className="text-sm font-semibold text-[#111827]">{assists}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-[#6B7280] mb-1">Min</p>
                      <p className="text-sm font-semibold text-[#111827]">{minutes}</p>
                    </div>
                  </div>

                  {/* Injury Status */}
                  {player.injuryStatus && player.injuryStatus !== "FIT" && (
                    <div className="mt-3 pt-3 border-t border-[#E5E7EB]">
                      <div className={`px-2 py-1 rounded text-xs font-medium text-center ${injuryStatus.bg} ${injuryStatus.text}`}>
                        {injuryStatus.label}
                      </div>
                    </div>
                  )}
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

