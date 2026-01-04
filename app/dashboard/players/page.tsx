"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

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

  const positionColors: Record<string, string> = {
    GK: "bg-yellow-100 text-yellow-800",
    DF: "bg-blue-100 text-blue-800",
    MF: "bg-green-100 text-green-800",
    FW: "bg-red-100 text-red-800",
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4">Players</h1>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Players
          </h1>
          <p className="text-gray-600">View and manage all players across teams</p>
        </div>
        <Link href="/dashboard/players/create">
          <Button>➕ Add Player</Button>
        </Link>
      </div>

      {players.length === 0 ? (
        <Card className="max-w-lg mx-auto text-center py-12">
          <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center text-4xl mb-4 mx-auto">
            ⚽
          </div>
          <h3 className="text-xl font-bold mb-2 text-gray-900">No players yet</h3>
          <p className="text-gray-600 mb-6">Add your first player to get started!</p>
          <Link href="/dashboard/players/create">
            <Button>Add Your First Player</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {players.map((player, index) => (
            <Card key={player.id} hover className="animate-fadeIn" style={{ animationDelay: `${index * 0.05}s` }}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md">
                    {player.firstName.charAt(0)}{player.lastName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">
                      {player.firstName} {player.lastName}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {player.team ? player.team.name : "No team"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between mb-4">
                <span
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                    positionColors[player.position] || "bg-gray-100 text-gray-800"
                  }`}
                >
                  {player.position}
                </span>
              </div>
              <div className="pt-4 border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Goals</span>
                  <span className="text-xl font-bold text-green-600">{getTotalGoals(player.stats)}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

