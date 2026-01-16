"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";
import DataTable from "@/components/ui/DataTable";

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
  const [selectedTeam, setSelectedTeam] = useState<string>("");

  useEffect(() => {
    fetch("/api/teams")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch teams");
        }
        return res.json();
      })
      .then((data) => {
        setTeams(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching teams:", error);
        setLoading(false);
      });
  }, []);

  const handleTeamSelect = (teamId: string) => {
    if (teamId) {
      window.location.href = `/dashboard/teams/${teamId}`;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Teams"
          description="Manage and view all your teams"
        />
        <Card className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#1A73E8] border-t-transparent mx-auto mb-4"></div>
          <p className="text-sm text-[#6B7280]">Loading teams...</p>
        </Card>
      </div>
    );
  }

  const tableColumns = [
    {
      key: "name",
      header: "Team Name",
      sortable: true,
      render: (team: Team) => (
        <Link
          href={`/dashboard/teams/${team.id}`}
          className="font-medium text-[#1A73E8] hover:text-[#1557B0]"
        >
          {team.name}
        </Link>
      ),
    },
    {
      key: "players",
      header: "Players",
      sortable: true,
      render: (team: Team) => (
        <span className="text-[#111827]">{team.players.length}</span>
      ),
    },
    {
      key: "matches",
      header: "Matches",
      sortable: true,
      render: (team: Team) => (
        <span className="text-[#111827]">{team.matches.length}</span>
      ),
    },
    {
      key: "members",
      header: "Members",
      sortable: true,
      render: (team: Team) => (
        <span className="text-[#111827]">{team.members.length}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teams"
        description="Manage and view all your teams"
        action={
          <Link href="/dashboard/create-team">
            <Button>Create Team</Button>
          </Link>
        }
      />

      {teams.length === 0 ? (
        <Card className="text-center py-12 px-6">
          <h3 className="text-lg font-semibold mb-2 text-[#111827]">No teams yet</h3>
          <p className="text-sm text-[#6B7280] mb-6">Create your first team to get started!</p>
          <Link href="/dashboard/create-team">
            <Button>Create Your First Team</Button>
          </Link>
        </Card>
      ) : (
        <DataTable
          data={teams}
          columns={tableColumns}
          searchable={true}
          searchPlaceholder="Search teams..."
          pagination={teams.length > 10}
          itemsPerPage={10}
          onRowClick={(team) => {
            window.location.href = `/dashboard/teams/${team.id}`;
          }}
        />
      )}
    </div>
  );
}

