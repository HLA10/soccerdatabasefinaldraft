"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Link from "next/link";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";
import StatWidget from "@/components/ui/StatWidget";

export default function DashboardHome() {
  const [stats, setStats] = useState({
    teams: 0,
    players: 0,
    matches: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/teams").then((res) => res.json()),
      fetch("/api/players").then((res) => res.json()),
      fetch("/api/matches").then((res) => res.json()),
    ])
      .then(([teams, players, matches]) => {
        setStats({
          teams: teams.length || 0,
          players: players.length || 0,
          matches: matches.length || 0,
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl">
      <PageHeader
        title="Dashboard"
        description="Manage your teams, players, and matches all in one place"
      />

      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatWidget
            label="Total Teams"
            value={stats.teams}
            icon="👥"
          />
          <StatWidget
            label="Total Players"
            value={stats.players}
            icon="⚽"
          />
          <StatWidget
            label="Total Matches"
            value={stats.matches}
            icon="🎯"
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link href="/dashboard/teams">
          <Card hover className="h-full">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-[#EBF4FF] rounded-lg flex items-center justify-center text-2xl">
                👥
              </div>
              <span className="text-xs font-medium text-[#1A73E8] bg-[#EBF4FF] px-2.5 py-1 rounded-md">
                View
              </span>
            </div>
            <h3 className="font-semibold text-lg mb-2 text-[#111827]">Teams</h3>
            <p className="text-[#6B7280] text-sm leading-relaxed">
              View and manage all your teams, see player rosters and match history
            </p>
            <div className="mt-4 text-[#1A73E8] font-medium text-sm flex items-center gap-1">
              Explore Teams
              <span>→</span>
            </div>
          </Card>
        </Link>

        <Link href="/dashboard/players">
          <Card hover className="h-full">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-[#ECFDF5] rounded-lg flex items-center justify-center text-2xl">
                ⚽
              </div>
              <span className="text-xs font-medium text-[#10B981] bg-[#ECFDF5] px-2.5 py-1 rounded-md">
                View
              </span>
            </div>
            <h3 className="font-semibold text-lg mb-2 text-[#111827]">Players</h3>
            <p className="text-[#6B7280] text-sm leading-relaxed">
              Browse all players, view their stats, positions, and team assignments
            </p>
            <div className="mt-4 text-[#10B981] font-medium text-sm flex items-center gap-1">
              Browse Players
              <span>→</span>
            </div>
          </Card>
        </Link>

        <Link href="/dashboard/calendar">
          <Card hover className="h-full">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-[#F5F3FF] rounded-lg flex items-center justify-center text-2xl">
                📅
              </div>
              <span className="text-xs font-medium text-[#8B5CF6] bg-[#F5F3FF] px-2.5 py-1 rounded-md">
                View
              </span>
            </div>
            <h3 className="font-semibold text-lg mb-2 text-[#111827]">Calendar</h3>
            <p className="text-[#6B7280] text-sm leading-relaxed">
              See all upcoming and past matches organized by date with scores
            </p>
            <div className="mt-4 text-[#8B5CF6] font-medium text-sm flex items-center gap-1">
              View Calendar
              <span>→</span>
            </div>
          </Card>
        </Link>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4 text-[#111827]">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard/create-team">
            <Button>Create Team</Button>
          </Link>
          <Link href="/dashboard/players/create">
            <Button variant="secondary">Add Player</Button>
          </Link>
          <Link href="/dashboard/matches/create">
            <Button variant="outline">Schedule Match</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
