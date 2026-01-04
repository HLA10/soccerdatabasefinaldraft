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
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Players</h1>
        <Link href="/dashboard/players/create">
          <Button>+ Add Player</Button>
        </Link>
      </div>

      {players.length === 0 ? (
        <Card className="max-w-lg">
          <p className="text-gray-600 mb-4">No players yet. Add your first player!</p>
          <Link href="/dashboard/players/create">
            <Button>Add Player</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {players.map((player) => (
            <Card key={player.id} className="hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-lg">
                    {player.firstName} {player.lastName}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {player.team ? player.team.name : "No team"}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-semibold ${
                    positionColors[player.position] || "bg-gray-100 text-gray-800"
                  }`}
                >
                  {player.position}
                </span>
              </div>
              <div className="pt-3 border-t">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Goals:</span>
                  <span className="font-semibold">{getTotalGoals(player.stats)}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

