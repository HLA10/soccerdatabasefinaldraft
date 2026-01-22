"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import PerformanceRadarChart from "@/components/ui/PerformanceRadarChart";

interface Player {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string | null;
  position: string;
  profileImageUrl?: string | null;
  injuryStatus?: string | null;
  jerseyNumber?: number | null;
  contractStatus?: boolean | null;
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

interface DevelopmentTalk {
  id: string;
  category: string;
  notes: string;
  goals?: string | null;
  actionPoints?: string | null;
  followUpDate?: string | null;
  createdAt: string;
  coach: {
    id: string;
    name: string;
    email: string;
  };
}

export default function PlayerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingContract, setUpdatingContract] = useState(false);
  
  // Tab navigation
  const [activeTab, setActiveTab] = useState<"overview" | "development-talks" | "performance">("overview");
  
  // Development talks
  const [developmentTalks, setDevelopmentTalks] = useState<DevelopmentTalk[]>([]);
  const [loadingTalks, setLoadingTalks] = useState(false);
  
  // Player dropdown
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(false);

  useEffect(() => {
    const playerId = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : null;
    
    if (playerId) {
      // Fetch player data
      fetch(`/api/players/${playerId}`)
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
      
      // Fetch development talks
      setLoadingTalks(true);
      fetch(`/api/players/${playerId}/talks`)
        .then((res) => {
          if (!res.ok) {
            throw new Error("Failed to fetch development talks");
          }
          return res.json();
        })
        .then((data) => {
          setDevelopmentTalks(data || []);
          setLoadingTalks(false);
        })
        .catch(() => {
          setLoadingTalks(false);
        });
    }
  }, [params.id]);
  
  // Fetch all players for dropdown
  useEffect(() => {
    setLoadingPlayers(true);
    fetch("/api/players")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch players");
        }
        return res.json();
      })
      .then((data) => {
        setAllPlayers(data || []);
        setLoadingPlayers(false);
      })
      .catch(() => {
        setLoadingPlayers(false);
      });
  }, []);

  const handleContractToggle = async () => {
    if (!player) return;
    setUpdatingContract(true);
    try {
      const res = await fetch(`/api/players/${player.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractStatus: !player.contractStatus }),
      });
      if (res.ok) {
        const updatedPlayer = await res.json();
        setPlayer(updatedPlayer);
      }
    } catch (error) {
      console.error("Error updating contract status:", error);
    } finally {
      setUpdatingContract(false);
    }
  };

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
            Back to Team
          </Button>
        </Card>
      </div>
    );
  }

  const totalGames = player.stats.length;
  const totalGoals = player.stats.reduce((sum, stat) => sum + (stat.goals || 0), 0);
  const totalAssists = player.stats.reduce((sum, stat) => sum + (stat.assists || 0), 0);
  const totalMinutes = player.stats.reduce((sum, stat) => sum + (stat.minutes || 0), 0);
  const avgRating = player.stats.length > 0 && player.stats.filter(s => s.rating).length > 0
    ? player.stats.reduce((sum, stat) => sum + (stat.rating || 0), 0) / player.stats.filter(s => s.rating).length
    : 0;
  // Prepare radar chart data (normalized values)
  const maxGoals = Math.max(...player.stats.map(s => s.goals || 0), 1);
  const maxAssists = Math.max(...player.stats.map(s => s.assists || 0), 1);
  const maxMinutes = Math.max(...player.stats.map(s => s.minutes || 0), 1);
  const maxRating = Math.max(...player.stats.map(s => s.rating || 0).filter(r => r > 0), 1);
  
  // For radar chart, normalize values to similar scale (0-100)
  const radarData = [
    { category: "Goals", value: totalGoals },
    { category: "Assists", value: totalAssists },
    { category: "Minutes", value: Math.min(totalMinutes / 10, 100) }, // Scale down for display
    { category: "Games", value: totalGames },
    { category: "Rating", value: avgRating > 0 ? avgRating * 20 : 0 }, // Scale to 0-100 if rating is 0-5
    { category: "Yellow", value: 0 }, // Cards not tracked in stats, set to 0
    { category: "Red", value: 0 }, // Cards not tracked in stats, set to 0
  ];

  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const formatMinutes = (minutes: number) => {
    return `${minutes}'`;
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
  const contractStatus = player.contractStatus ?? true;

  const playerId = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : null;
  
  const tabs = [
    { id: "overview" as const, label: "Overview" },
    { id: "development-talks" as const, label: "Development Talks" },
    { id: "performance" as const, label: "Performance" },
  ];
  
  const getCategoryColor = (category: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      TECHNICAL: { bg: "bg-[#DBEAFE]", text: "text-[#1E40AF]" },
      TACTICAL: { bg: "bg-[#D1FAE5]", text: "text-[#065F46]" },
      PHYSICAL: { bg: "bg-[#FEE2E2]", text: "text-[#991B1B]" },
      MENTAL: { bg: "bg-[#FEF3C7]", text: "text-[#92400E]" },
      BEHAVIOR: { bg: "bg-[#E9D5FF]", text: "text-[#6B21A8]" },
    };
    return colors[category] || { bg: "bg-[#F3F4F6]", text: "text-[#374151]" };
  };

  return (
    <div className="max-w-7xl">
      <PageHeader
        title="Player Profile"
        action={
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <select
              value={playerId || ""}
              onChange={(e) => {
                if (e.target.value) {
                  router.push(`/dashboard/players/${e.target.value}`);
                }
              }}
              className="border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#1A73E8] bg-white min-w-[180px] sm:min-w-[200px]"
            >
              <option value="">Select player...</option>
              {allPlayers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.firstName} {p.lastName} {p.jerseyNumber ? `#${p.jerseyNumber}` : ""}
                </option>
              ))}
            </select>
            <Button variant="secondary" onClick={() => router.push("/dashboard/players")} className="w-full sm:w-auto">
              Back to Team
            </Button>
          </div>
        }
      />
      
      {/* Tab Navigation */}
      <div className="mb-6 border-b border-[#E5E7EB] overflow-x-auto">
        <nav className="flex space-x-4 md:space-x-8 min-w-max md:min-w-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-2 md:px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-[#1A73E8] text-[#1A73E8]"
                  : "border-transparent text-[#6B7280] hover:text-[#111827] hover:border-[#D1D5DB]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <>
          {/* Profile Header Section */}
          <Card className="mb-6">
            <div className="flex flex-col md:flex-row items-start gap-6">
              {/* Profile Image */}
              <div className="relative flex-shrink-0">
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
              </div>

              {/* Player Info */}
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl font-bold text-[#111827] mb-2">
                  {player.firstName} {player.lastName}
                </h1>
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${positionColors.bg} ${positionColors.text}`}>
                    {player.position}
                  </span>
                  {player.jerseyNumber && (
                    <span className="text-sm font-medium text-[#6B7280]">
                      #{player.jerseyNumber}
                    </span>
                  )}
                </div>
                {player.dateOfBirth && (
                  <p className="text-sm text-[#6B7280] mb-4">
                    Born: {new Date(player.dateOfBirth).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  </p>
                )}

                {/* Contract Status */}
                <div className="mb-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-medium text-[#111827]">Contract Status:</span>
                    <button
                      type="button"
                      onClick={handleContractToggle}
                      disabled={updatingContract}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        contractStatus ? "bg-[#10B981]" : "bg-[#D1D5DB]"
                      } ${updatingContract ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      <span
                        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          contractStatus ? "translate-x-6" : "translate-x-0"
                        }`}
                      />
                    </button>
                    <span className="text-sm font-medium text-[#111827]">
                      {contractStatus ? "Under Contract" : "Not Under Contract"}
                    </span>
                  </div>
                  <p className="text-xs text-[#6B7280] ml-36">
                    Player is currently {contractStatus ? "under contract" : "not under contract"} with the team.
                  </p>
                </div>
              </div>

              {/* Stats Summary Cards */}
              <div className="grid grid-cols-4 gap-4 w-full md:w-auto">
                <div className="text-center">
                  <p className="text-2xl font-bold text-[#111827]">{totalGames}</p>
                  <p className="text-xs text-[#6B7280] mt-1">Games</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-[#111827]">{totalMinutes}</p>
                  <p className="text-xs text-[#6B7280] mt-1">Minutes</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-[#111827]">{totalGoals}</p>
                  <p className="text-xs text-[#6B7280] mt-1">Goals</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-[#111827]">{totalAssists}</p>
                  <p className="text-xs text-[#6B7280] mt-1">Assists</p>
                </div>
              </div>
            </div>
          </Card>
        </>
      )}

      {activeTab === "development-talks" && (
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-[#111827]">Development Talks</h2>
          </div>
          
          {loadingTalks ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#1A73E8] border-t-transparent mx-auto mb-4"></div>
              <p className="text-sm text-[#6B7280]">Loading development talks...</p>
            </div>
          ) : developmentTalks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-[#6B7280] mb-4">No development talks recorded yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {developmentTalks.map((talk) => {
                const categoryColors = getCategoryColor(talk.category);
                return (
                  <div
                    key={talk.id}
                    className="border border-[#E5E7EB] rounded-lg p-6 hover:border-[#D1D5DB] transition-colors"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${categoryColors.bg} ${categoryColors.text}`}>
                          {talk.category}
                        </span>
                        <span className="text-sm text-[#6B7280]">
                          {formatDateShort(talk.createdAt)}
                        </span>
                      </div>
                      <span className="text-sm text-[#6B7280]">
                        by {talk.coach.name}
                      </span>
                    </div>
                    
                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-[#111827] mb-2">Notes</h3>
                      <p className="text-sm text-[#6B7280] whitespace-pre-wrap">{talk.notes}</p>
                    </div>
                    
                    {talk.goals && (
                      <div className="mb-4">
                        <h3 className="text-sm font-medium text-[#111827] mb-2">Goals</h3>
                        <p className="text-sm text-[#6B7280] whitespace-pre-wrap">{talk.goals}</p>
                      </div>
                    )}
                    
                    {talk.actionPoints && (
                      <div className="mb-4">
                        <h3 className="text-sm font-medium text-[#111827] mb-2">Action Points</h3>
                        <p className="text-sm text-[#6B7280] whitespace-pre-wrap">{talk.actionPoints}</p>
                      </div>
                    )}
                    
                    {talk.followUpDate && (
                      <div className="pt-4 border-t border-[#E5E7EB]">
                        <p className="text-xs text-[#6B7280]">
                          Follow-up: {formatDateShort(talk.followUpDate)}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {activeTab === "performance" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Performance Radar */}
          <Card>
            <h2 className="text-lg font-semibold text-[#111827] mb-4">Performance Radar</h2>
            <PerformanceRadarChart data={radarData} />
            <div className="mt-4 pt-4 border-t border-[#E5E7EB]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-[#6B7280]">Avg Rating</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className={`w-4 h-4 ${star <= Math.round(avgRating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                  <span className="text-sm font-medium text-[#111827] ml-2">
                    {avgRating > 0 ? avgRating.toFixed(1) : "0.0"}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#6B7280]">Cards</span>
                <span className="text-sm font-medium text-[#111827]">
                  Cards: 0Y 0R
                </span>
              </div>
            </div>
          </Card>

          {/* Right: Games Played Table */}
          <Card>
            <h2 className="text-lg font-semibold text-[#111827] mb-4">Games Played ({totalGames})</h2>
            {player.stats.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-[#6B7280]">No games recorded yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#E5E7EB]">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Date</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Opponent</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-[#6B7280]">Minutes</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-[#6B7280]">Goals</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-[#6B7280]">Assists</th>
                    </tr>
                  </thead>
                  <tbody>
                    {player.stats.map((stat) => (
                      <tr key={stat.id} className="border-b border-[#E5E7EB] hover:bg-[#F9FAFB] transition-colors">
                        <td className="py-3 px-4 text-sm text-[#111827]">
                          {formatDateShort(stat.match.date)}
                        </td>
                        <td className="py-3 px-4 text-sm text-[#111827]">
                          {stat.match.opponent}
                        </td>
                        <td className="py-3 px-4 text-sm text-[#111827] text-right">
                          {formatMinutes(stat.minutes)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {stat.goals > 0 ? (
                            <span className="inline-block bg-[#111827] text-white text-sm font-medium px-2 py-1 rounded">
                              {stat.goals}
                            </span>
                          ) : (
                            <span className="text-sm text-[#111827]">0</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {stat.assists > 0 ? (
                            <span className="inline-block bg-[#111827] text-white text-sm font-medium px-2 py-1 rounded">
                              {stat.assists}
                            </span>
                          ) : (
                            <span className="text-sm text-[#111827]">0</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
