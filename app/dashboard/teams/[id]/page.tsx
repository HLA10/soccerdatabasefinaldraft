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
    <div className="max-w-7xl">
      <div className="mb-8">
        <Link href="/dashboard/teams" className="text-blue-600 hover:text-blue-700 font-medium mb-4 inline-flex items-center gap-2 transition-colors">
          <span>←</span> Back to Teams
        </Link>
        <div className="flex items-center gap-6 mt-6">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg">
            {team.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-semibold mb-2 text-[#111827]">
              {team.name}
            </h1>
            <div className="flex flex-wrap gap-6 text-[#6B7280]">
              <span className="text-sm">
                <span className="font-semibold text-[#111827]">{team.players.length}</span> players
              </span>
              <span className="text-sm">
                <span className="font-semibold text-[#111827]">{team.matches.length}</span> matches
              </span>
              <span className="text-sm">
                <span className="font-semibold text-[#111827]">{team.members.length}</span> members
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Players Section */}
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center text-white">
              ⚽
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Players</h2>
          </div>
          {team.players.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No players added to this team yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {team.players.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-100 hover:border-blue-200 transition-all"
                >
                  <div>
                    <p className="font-semibold text-gray-900">
                      {player.firstName} {player.lastName}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">{player.position}</p>
                  </div>
                  <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-semibold">
                    {player.position}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Matches Section */}
        <Card>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-[#111827]">Recent Matches</h2>
            <p className="text-sm text-[#6B7280] mt-1">Match history</p>
          </div>
          {team.matches.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No matches scheduled yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {team.matches.slice(0, 5).map((match) => {
                const totalGoals = match.stats.reduce(
                  (sum: number, stat: any) => sum + (stat.goals || 0),
                  0
                );
                return (
                  <div
                    key={match.id}
                    className="p-5 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100 hover:shadow-md transition-all"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-bold text-lg text-gray-900">vs {match.opponent}</p>
                        <p className="text-sm text-gray-600 mt-1">{formatDate(match.date)}</p>
                      </div>
                      {totalGoals > 0 && (
                        <div className="text-right">
                          <p className="text-3xl font-bold text-green-600">{totalGoals}</p>
                          <p className="text-xs text-gray-500 font-medium">goals</p>
                        </div>
                      )}
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

