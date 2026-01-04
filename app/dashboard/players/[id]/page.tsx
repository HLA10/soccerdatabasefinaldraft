"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";

interface Player {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string | null;
  position: string;
  profileImageUrl?: string | null;
  injuryStatus?: string | null;
  team?: {
    id: string;
    name: string;
  } | null;
  stats: Array<{
    id: string;
    goals: number;
    assists: number;
    minutes: number;
    rating?: number | null;
    match: {
      id: string;
      date: string;
      opponent: string;
    };
  }>;
}

type Tab = "overview" | "matches" | "training" | "medical" | "notes";

export default function PlayerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  useEffect(() => {
    if (params.id) {
      fetch(`/api/players/${params.id}`)
        .then((res) => {
          if (!res.ok) {
            throw new Error("Failed to fetch player");
          }
          return res.json();
        })
        .then((data) => {
          setPlayer(data);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="max-w-7xl">
        <PageHeader title="Player Profile" />
        <Card className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#1A73E8] border-t-transparent mx-auto mb-4"></div>
          <p className="text-sm text-[#6B7280]">Loading player profile...</p>
        </Card>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="max-w-7xl">
        <PageHeader title="Player Profile" />
        <Card className="text-center py-12">
          <p className="text-[#6B7280] mb-4">Player not found</p>
          <Button onClick={() => router.push("/dashboard/players")}>
            Back to Players
          </Button>
        </Card>
      </div>
    );
  }

  const totalGoals = player.stats.reduce((sum, stat) => sum + (stat.goals || 0), 0);
  const totalAssists = player.stats.reduce((sum, stat) => sum + (stat.assists || 0), 0);
  const totalMinutes = player.stats.reduce((sum, stat) => sum + (stat.minutes || 0), 0);
  const avgRating = player.stats.length > 0
    ? player.stats.reduce((sum, stat) => sum + (stat.rating || 0), 0) / player.stats.filter(s => s.rating).length
    : 0;

  const getInjuryStatusColor = (status: string | null | undefined) => {
    const colors: Record<string, { bg: string; text: string; label: string }> = {
      FIT: { bg: "bg-[#D1FAE5]", text: "text-[#065F46]", label: "Fit" },
      QUESTIONABLE: { bg: "bg-[#FEF3C7]", text: "text-[#92400E]", label: "Questionable" },
      INJURED: { bg: "bg-[#FEE2E2]", text: "text-[#991B1B]", label: "Injured" },
      RECOVERING: { bg: "bg-[#DBEAFE]", text: "text-[#1E40AF]", label: "Recovering" },
    };
    return colors[status || "FIT"] || colors.FIT;
  };

  const getPositionColor = (position: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      GK: { bg: "bg-[#FEF3C7]", text: "text-[#92400E]" },
      DF: { bg: "bg-[#DBEAFE]", text: "text-[#1E40AF]" },
      MF: { bg: "bg-[#D1FAE5]", text: "text-[#065F46]" },
      FW: { bg: "bg-[#FEE2E2]", text: "text-[#991B1B]" },
    };
    return colors[position] || { bg: "bg-[#F3F4F6]", text: "text-[#374151]" };
  };

  const positionColors = getPositionColor(player.position);
  const injuryColors = getInjuryStatusColor(player.injuryStatus);

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "matches", label: "Matches" },
    { id: "training", label: "Training" },
    { id: "medical", label: "Medical" },
    { id: "notes", label: "Notes" },
  ];

  return (
    <div className="max-w-7xl">
      <PageHeader
        title="Player Profile"
        action={
          <Button variant="secondary" onClick={() => router.push("/dashboard/players")}>
            Back to Players
          </Button>
        }
      />

      {/* Profile Header */}
      <Card className="mb-6">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Profile Image */}
          <div className="relative">
            {player.profileImageUrl ? (
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg">
                <img
                  src={player.profileImageUrl}
                  alt={`${player.firstName} ${player.lastName}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#1A73E8] to-[#1557B0] flex items-center justify-center text-white text-4xl font-bold shadow-lg border-4 border-white">
                {player.firstName.charAt(0)}{player.lastName.charAt(0)}
              </div>
            )}
            {player.injuryStatus && player.injuryStatus !== "FIT" && (
              <div className={`absolute -bottom-2 -right-2 w-8 h-8 ${injuryColors.bg} rounded-full border-2 border-white flex items-center justify-center`} title={injuryColors.label}>
                <span className="text-sm">⚠️</span>
              </div>
            )}
          </div>

          {/* Player Info */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-bold text-[#111827] mb-2">
              {player.firstName} {player.lastName}
            </h1>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${positionColors.bg} ${positionColors.text}`}>
                {player.position}
              </span>
              {player.team && (
                <span className="text-sm text-[#6B7280]">
                  {player.team.name}
                </span>
              )}
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${injuryColors.bg} ${injuryColors.text}`}>
                {injuryColors.label}
              </span>
            </div>
            {player.dateOfBirth && (
              <p className="text-sm text-[#6B7280]">
                Date of Birth: {new Date(player.dateOfBirth).toLocaleDateString()}
              </p>
            )}
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-4 gap-4 w-full md:w-auto">
            <div className="text-center">
              <p className="text-2xl font-bold text-[#111827]">{totalGoals}</p>
              <p className="text-xs text-[#6B7280]">Goals</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-[#111827]">{totalAssists}</p>
              <p className="text-xs text-[#6B7280]">Assists</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-[#111827]">{totalMinutes}</p>
              <p className="text-xs text-[#6B7280]">Minutes</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-[#111827]">
                {avgRating > 0 ? avgRating.toFixed(1) : "-"}
              </p>
              <p className="text-xs text-[#6B7280]">Rating</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="border-b border-[#E5E7EB] mb-6">
        <div className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? "border-[#1A73E8] text-[#1A73E8]"
                  : "border-transparent text-[#6B7280] hover:text-[#111827] hover:border-[#9CA3AF]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <Card>
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-[#111827] mb-4">Statistics</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-[#F9FAFB] rounded-lg">
                  <p className="text-sm text-[#6B7280] mb-1">Total Matches</p>
                  <p className="text-2xl font-bold text-[#111827]">{player.stats.length}</p>
                </div>
                <div className="p-4 bg-[#F9FAFB] rounded-lg">
                  <p className="text-sm text-[#6B7280] mb-1">Total Goals</p>
                  <p className="text-2xl font-bold text-[#111827]">{totalGoals}</p>
                </div>
                <div className="p-4 bg-[#F9FAFB] rounded-lg">
                  <p className="text-sm text-[#6B7280] mb-1">Total Assists</p>
                  <p className="text-2xl font-bold text-[#111827]">{totalAssists}</p>
                </div>
                <div className="p-4 bg-[#F9FAFB] rounded-lg">
                  <p className="text-sm text-[#6B7280] mb-1">Avg Rating</p>
                  <p className="text-2xl font-bold text-[#111827]">
                    {avgRating > 0 ? avgRating.toFixed(1) : "-"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "matches" && (
          <div>
            <h2 className="text-lg font-semibold text-[#111827] mb-4">Match History</h2>
            {player.stats.length === 0 ? (
              <p className="text-[#6B7280]">No matches recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {player.stats.map((stat) => (
                  <div
                    key={stat.id}
                    className="p-4 border border-[#E5E7EB] rounded-lg hover:bg-[#F9FAFB] transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-[#111827]">
                          {new Date(stat.match.date).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-[#6B7280]">vs {stat.match.opponent}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex gap-4 text-sm">
                          <div>
                            <span className="text-[#6B7280]">G:</span>
                            <span className="ml-1 font-medium text-[#111827]">{stat.goals}</span>
                          </div>
                          <div>
                            <span className="text-[#6B7280]">A:</span>
                            <span className="ml-1 font-medium text-[#111827]">{stat.assists}</span>
                          </div>
                          <div>
                            <span className="text-[#6B7280]">Min:</span>
                            <span className="ml-1 font-medium text-[#111827]">{stat.minutes}</span>
                          </div>
                          {stat.rating && (
                            <div>
                              <span className="text-[#6B7280]">Rating:</span>
                              <span className="ml-1 font-medium text-[#111827]">{stat.rating.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "training" && (
          <div>
            <h2 className="text-lg font-semibold text-[#111827] mb-4">Training Records</h2>
            <p className="text-[#6B7280]">Training data will be available here.</p>
          </div>
        )}

        {activeTab === "medical" && (
          <div>
            <h2 className="text-lg font-semibold text-[#111827] mb-4">Medical Information</h2>
            <div className="space-y-4">
              <div className="p-4 bg-[#F9FAFB] rounded-lg">
                <p className="text-sm font-medium text-[#6B7280] mb-1">Injury Status</p>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${injuryColors.bg} ${injuryColors.text}`}>
                  {injuryColors.label}
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === "notes" && (
          <div>
            <h2 className="text-lg font-semibold text-[#111827] mb-4">Notes</h2>
            <p className="text-[#6B7280]">Player notes will be available here.</p>
          </div>
        )}
      </Card>
    </div>
  );
}

