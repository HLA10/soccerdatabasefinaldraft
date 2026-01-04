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
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Teams</h1>
        <Link href="/dashboard/create-team">
          <Button>+ Create Team</Button>
        </Link>
      </div>

      {teams.length === 0 ? (
        <Card className="max-w-lg">
          <p className="text-gray-600 mb-4">No teams yet. Create your first team!</p>
          <Link href="/dashboard/create-team">
            <Button>Create Team</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team) => (
            <Link key={team.id} href={`/dashboard/teams/${team.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                    {team.name.charAt(0)}
                  </div>
                  <span className="text-sm text-gray-500">
                    {team.players.length} players
                  </span>
                </div>
                <h3 className="font-bold text-lg mb-2">{team.name}</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>{team.matches.length} matches</p>
                  <p>{team.members.length} members</p>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <span className="text-blue-600 text-sm font-medium">
                    View Team →
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

