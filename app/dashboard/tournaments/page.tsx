"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";
import DataTable from "@/components/ui/DataTable";

interface Tournament {
  id: string;
  name: string;
  type: string;
  startDate: string | null;
  endDate: string | null;
  description: string | null;
  matches: any[];
  createdAt: string;
}

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tournaments")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch tournaments");
        }
        return res.json();
      })
      .then((data) => {
        setTournaments(data || []);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching tournaments:", error);
        setLoading(false);
      });
  }, []);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="max-w-7xl">
        <PageHeader
          title="Tournaments"
          description="Manage and view all tournaments"
        />
        <Card className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#1A73E8] border-t-transparent mx-auto mb-4"></div>
          <p className="text-sm text-[#6B7280]">Loading tournaments...</p>
        </Card>
      </div>
    );
  }

  const tableColumns = [
    {
      key: "name",
      header: "Tournament Name",
      sortable: true,
      render: (tournament: Tournament) => (
        <span className="font-medium text-[#111827]">{tournament.name}</span>
      ),
    },
    {
      key: "type",
      header: "Type",
      sortable: true,
      render: (tournament: Tournament) => (
        <span className="text-[#111827] capitalize">{tournament.type.toLowerCase()}</span>
      ),
    },
    {
      key: "startDate",
      header: "Start Date",
      sortable: true,
      render: (tournament: Tournament) => (
        <span className="text-[#111827]">{formatDate(tournament.startDate)}</span>
      ),
    },
    {
      key: "endDate",
      header: "End Date",
      sortable: true,
      render: (tournament: Tournament) => (
        <span className="text-[#111827]">{formatDate(tournament.endDate)}</span>
      ),
    },
    {
      key: "matches",
      header: "Matches",
      sortable: true,
      render: (tournament: Tournament) => (
        <span className="text-[#111827]">{tournament.matches?.length || 0}</span>
      ),
    },
  ];

  return (
    <div className="max-w-7xl">
      <PageHeader
        title="Tournaments"
        description="Manage and view all tournaments"
      />

      {tournaments.length === 0 ? (
        <Card className="text-center py-12 px-6">
          <h3 className="text-lg font-semibold mb-2 text-[#111827]">No tournaments yet</h3>
          <p className="text-sm text-[#6B7280] mb-6">Create your first tournament to get started!</p>
        </Card>
      ) : (
        <DataTable
          data={tournaments}
          columns={tableColumns}
          searchable={true}
          searchPlaceholder="Search tournaments..."
          pagination={tournaments.length > 10}
          itemsPerPage={10}
        />
      )}
    </div>
  );
}
