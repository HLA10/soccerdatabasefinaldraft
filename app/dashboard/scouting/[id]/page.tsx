"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
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
  creator: {
    id: string;
    name?: string | null;
    email: string;
  };
}

export default function ScoutingReportPage() {
  const params = useParams();
  const router = useRouter();
  const [report, setReport] = useState<ScoutingReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetch(`/api/scouting-reports/${params.id}`)
        .then((res) => res.json())
        .then((data) => {
          setReport(data);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    }
  }, [params.id]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this scouting report? This action cannot be undone.")) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/scouting-reports/${params.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete report");
      }

      router.push("/dashboard/scouting");
    } catch (error: any) {
      alert(error.message || "Failed to delete report");
      setDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Scouting Report" />
        <Card className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#1A73E8] border-t-transparent mx-auto mb-4"></div>
          <p className="text-sm text-[#6B7280]">Loading report...</p>
        </Card>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="space-y-6">
        <PageHeader title="Scouting Report" />
        <Card className="text-center py-12">
          <p className="text-[#6B7280]">Report not found</p>
          <Link href="/dashboard/scouting" className="mt-4 inline-block">
            <Button variant="secondary">Back to Reports</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const clubOrTeam = report.club || report.team;
  const logoUrl = report.club?.logoUrl || report.team?.logoUrl || report.team?.club?.logoUrl || null;
  const organizationName = report.club?.name || report.team?.name || "Unknown";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Scouting Report"
        description={`Report for ${report.playerName}`}
        action={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={handleDelete}
              disabled={deleting}
              className="text-sm"
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
            <Link href="/dashboard/scouting">
              <Button variant="secondary" className="text-sm">
                Back to Reports
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <Card>
            <div className="space-y-6">
              {/* Player Info */}
              <div>
                <h2 className="text-lg font-semibold text-[#111827] mb-4">Player Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-[#6B7280]">Player Name</label>
                    <p className="text-base text-[#111827] mt-1">
                      {report.playerName}
                      {report.ageGroup && <span className="text-[#6B7280] ml-2">({report.ageGroup})</span>}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#6B7280]">Date Observed</label>
                    <p className="text-base text-[#111827] mt-1">{formatDate(report.dateObserved)}</p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <h2 className="text-lg font-semibold text-[#111827] mb-4">Observations</h2>
                <div className="prose max-w-none">
                  <p className="text-[#111827] whitespace-pre-wrap">{report.notes}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div>
          <Card>
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-[#111827] mb-4">Club/Team</h3>
              {clubOrTeam ? (
                <div className="flex flex-col items-center text-center">
                  {logoUrl && (
                    <div className="relative w-24 h-24 mb-4">
                      <Image
                        src={logoUrl}
                        alt={organizationName}
                        fill
                        className="object-contain rounded"
                      />
                    </div>
                  )}
                  <p className="text-base font-semibold text-[#111827]">{organizationName}</p>
                  {report.team?.club && report.club && (
                    <p className="text-sm text-[#6B7280] mt-1">{report.team.club.name}</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-[#6B7280]">No club/team specified</p>
              )}

              <div className="pt-4 border-t border-[#E5E7EB]">
                <h3 className="text-sm font-semibold text-[#111827] mb-2">Report Details</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-[#6B7280]">Created:</span>
                    <span className="text-[#111827] ml-2">{formatDate(report.createdAt)}</span>
                  </div>
                  <div>
                    <span className="text-[#6B7280]">By:</span>
                    <span className="text-[#111827] ml-2">
                      {report.creator.name || report.creator.email}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
