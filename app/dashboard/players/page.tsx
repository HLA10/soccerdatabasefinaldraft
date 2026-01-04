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
        <Card className="text-center py-12">
          <div className="w-16 h-16 bg-[#ECFDF5] rounded-full flex items-center justify-center text-3xl mb-4 mx-auto">
            ⚽
          </div>
          <h3 className="text-lg font-semibold mb-2 text-[#111827]">No players yet</h3>
          <p className="text-sm text-[#6B7280] mb-6">Add your first player to get started!</p>
          <Link href="/dashboard/players/create">
            <Button>Add Your First Player</Button>
          </Link>
        </Card>
      ) : (
        <DataTable
          data={players}
          columns={tableColumns}
          searchable={true}
          searchPlaceholder="Search players..."
          pagination={players.length > 10}
          itemsPerPage={10}
        />
      )}
    </div>
  );
}

