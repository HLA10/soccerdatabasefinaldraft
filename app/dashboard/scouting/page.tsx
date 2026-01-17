"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";

interface ScoutingReport {
  id: string;
  playerName: string;
  club?: {
    id: string;
    name: string;
    logoUrl?: string | null;
  } | null;
  team?: {
    id: string;
    name: string;
    logoUrl?: string | null;
    club?: {
      id: string;
      name: string;
      logoUrl?: string | null;
    } | null;
  } | null;
  ageGroup?: string | null;
  notes: string;
  dateObserved: string;
  createdAt: string;
}

export default function ScoutingReportsPage() {
  const [reports, setReports] = useState<ScoutingReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/scouting-reports")
      .then((res) => res.json())
      .then((data) => {
        setReports(data || []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Scouting Reports"
          description="View and manage scouting reports"
        />
        <Card className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#1A73E8] border-t-transparent mx-auto mb-4"></div>
          <p className="text-sm text-[#6B7280]">Loading reports...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Scouting Reports"
        description="View and manage scouting reports"
        action={
          <Link href="/dashboard/scouting/create">
            <Button>Create Report</Button>
          </Link>
        }
      />

      {reports.length === 0 ? (
        <Card className="text-center py-12 px-6">
          <h3 className="text-lg font-semibold mb-2 text-[#111827]">No scouting reports yet</h3>
          <p className="text-sm text-[#6B7280] mb-6">Create your first scouting report to get started</p>
          <Link href="/dashboard/scouting/create">
            <Button>Create Report</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => {
            const clubOrTeam = report.club || report.team;
            const logoUrl = report.club?.logoUrl || report.team?.logoUrl || report.team?.club?.logoUrl || null;
            const organizationName = report.club?.name || report.team?.name || "Unknown";

            return (
              <Link key={report.id} href={`/dashboard/scouting/${report.id}`}>
                <Card hover className="cursor-pointer">
                  <div className="flex items-center gap-4">
                    {logoUrl && (
                      <div className="relative w-16 h-16 flex-shrink-0">
                        <Image
                          src={logoUrl}
                          alt={organizationName}
                          fill
                          className="object-contain rounded"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-base font-semibold text-[#111827]">
                          {report.playerName}
                        </h3>
                        {report.ageGroup && (
                          <span className="text-sm text-[#6B7280]">({report.ageGroup})</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-[#6B7280]">
                        <span>{organizationName}</span>
                        <span>•</span>
                        <span>Observed: {formatDate(report.dateObserved)}</span>
                      </div>
                      <p className="text-sm text-[#6B7280] mt-2 line-clamp-2">
                        {report.notes}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <Button variant="secondary" className="text-sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
