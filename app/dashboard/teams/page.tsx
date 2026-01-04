"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

interface Team {
  id: string;
  name: string;
  members: any[];
  players: any[];
  matches: any[];
  createdAt: string;
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/teams")
      .then((res) => res.json())
      .then((data) => {
        setTeams(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4">Teams</h1>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Teams
          </h1>
          <p className="text-gray-600">Manage and view all your teams</p>
        </div>
        <Link href="/dashboard/create-team">
          <Button>➕ Create Team</Button>
        </Link>
      </div>

      {teams.length === 0 ? (
        <Card className="max-w-lg mx-auto text-center py-12">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center text-4xl mb-4 mx-auto">
            👥
          </div>
          <h3 className="text-xl font-bold mb-2 text-gray-900">No teams yet</h3>
          <p className="text-gray-600 mb-6">Create your first team to get started!</p>
          <Link href="/dashboard/create-team">
            <Button>Create Your First Team</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team, index) => (
            <Link key={team.id} href={`/dashboard/teams/${team.id}`}>
              <Card hover className="h-full cursor-pointer animate-fadeIn" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                    {team.name.charAt(0)}
                  </div>
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                    {team.players.length} players
                  </span>
                </div>
                <h3 className="font-bold text-xl mb-3 text-gray-900">{team.name}</h3>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>🎯</span>
                    <span>{team.matches.length} matches</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>👤</span>
                    <span>{team.members.length} members</span>
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-100">
                  <span className="text-blue-600 text-sm font-semibold flex items-center gap-2">
                    View Details
                    <span>→</span>
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

