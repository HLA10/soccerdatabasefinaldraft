"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Card from "@/components/ui/Card";

interface Player {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  teamId: string | null;
}

interface Match {
  id: string;
  date: string;
  opponent: string;
  stats: any[];
}

interface Team {
  id: string;
  name: string;
  members: any[];
  players: Player[];
  matches: Match[];
}

export default function TeamDashboard() {
  const params = useParams();
  const teamId = params.id as string;
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (teamId) {
      fetch(`/api/teams/${teamId}`)
        .then((res) => res.json())
        .then((data) => {
          setTeam(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [teamId]);

  if (loading) {
    return (
      <div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!team) {
    return (
      <div>
        <p>Team not found</p>
        <Link href="/dashboard/teams">← Back to Teams</Link>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div>
      <div className="mb-6">
        <Link href="/dashboard/teams" className="text-blue-600 hover:underline mb-2 inline-block">
          ← Back to Teams
        </Link>
        <div className="flex items-center gap-4 mt-4">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {team.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-3xl font-bold">{team.name}</h1>
            <p className="text-gray-600">
              {team.players.length} players • {team.matches.length} matches • {team.members.length} members
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Players Section */}
        <Card>
          <h2 className="text-xl font-bold mb-4">Players</h2>
          {team.players.length === 0 ? (
            <p className="text-gray-600">No players yet.</p>
          ) : (
            <div className="space-y-2">
              {team.players.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded"
                >
                  <div>
                    <p className="font-medium">
                      {player.firstName} {player.lastName}
                    </p>
                    <p className="text-sm text-gray-600">{player.position}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Matches Section */}
        <Card>
          <h2 className="text-xl font-bold mb-4">Recent Matches</h2>
          {team.matches.length === 0 ? (
            <p className="text-gray-600">No matches yet.</p>
          ) : (
            <div className="space-y-3">
              {team.matches.slice(0, 5).map((match) => {
                const totalGoals = match.stats.reduce(
                  (sum: number, stat: any) => sum + (stat.goals || 0),
                  0
                );
                return (
                  <div
                    key={match.id}
                    className="p-4 bg-gray-50 rounded border-l-4 border-blue-600"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold">vs {match.opponent}</p>
                        <p className="text-sm text-gray-600">{formatDate(match.date)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold">{totalGoals}</p>
                        <p className="text-xs text-gray-500">goals</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

