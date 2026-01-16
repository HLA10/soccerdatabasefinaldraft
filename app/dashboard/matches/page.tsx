"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";
import { TrashIcon } from "@heroicons/react/24/outline";

interface Match {
  id: string;
  date: string;
  opponent: string;
  opponentName?: string | null;
  team: {
    id: string;
    name: string;
  };
  homeTeam?: {
    id: string;
    name: string;
  } | null;
  awayTeam?: {
    id: string;
    name: string;
  } | null;
  venue?: string | null;
  stats: any[];
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      const res = await fetch("/api/games");
      const data = await res.json();
      setMatches(data || []);
    } catch (error) {
      console.error("Error fetching matches:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (matchId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm("Are you sure you want to delete this game? This action cannot be undone.")) {
      return;
    }

    setDeleting(matchId);
    try {
      const res = await fetch(`/api/games/${matchId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete game");
      }

      // Remove from local state
      setMatches((prev) => prev.filter((m) => m.id !== matchId));
    } catch (error: any) {
      alert(error.message || "Failed to delete game");
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Pagination calculations
  const totalPages = Math.ceil(matches.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentMatches = matches.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Matches"
          description="View and manage all matches"
        />
        <Card className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#1A73E8] border-t-transparent mx-auto mb-4"></div>
          <p className="text-sm text-[#6B7280]">Loading matches...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Matches"
        description="View and manage all matches"
        action={
          <div className="flex gap-2">
            <Link href="/dashboard/games/mobile" className="lg:hidden">
              <Button variant="secondary" className="text-sm">
                Mobile View
              </Button>
            </Link>
            <Link href="/dashboard/games/register">
              <Button>Register Game</Button>
            </Link>
          </div>
        }
      />

      {matches.length === 0 ? (
        <Card className="text-center py-12 px-6">
          <h3 className="text-lg font-semibold mb-2 text-[#111827]">
            No matches yet
          </h3>
          <p className="text-sm text-[#6B7280] mb-6">
            Register your first match to get started
          </p>
          <Link href="/dashboard/games/register">
            <Button>Register Game</Button>
          </Link>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {currentMatches.map((match) => {
              const homeTeamName = match.homeTeam?.name || match.team?.name || "Home Team";
              const awayTeamName = match.awayTeam?.name || match.opponentName || match.opponent || "Away Team";
              const totalGoals = match.stats.reduce(
                (sum: number, stat: any) => sum + (stat.goals || 0),
                0
              );

              return (
                <Link key={match.id} href={`/dashboard/games/${match.id}/squad`}>
                  <Card hover className="cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <h3 className="text-base font-semibold text-[#111827]">
                            {homeTeamName} vs {awayTeamName}
                          </h3>
                          {match.venue && (
                            <span className="text-sm text-[#6B7280]">• {match.venue}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-[#6B7280]">
                          <span>{formatDate(match.date)}</span>
                          {totalGoals > 0 && (
                            <>
                              <span>•</span>
                              <span className="font-medium text-[#10B981]">{totalGoals} goals</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="secondary" className="text-sm">
                          View Details
                        </Button>
                        <button
                          onClick={(e) => handleDelete(match.id, e)}
                          disabled={deleting === match.id}
                          className="p-2 text-[#EF4444] hover:bg-[#FEE2E2] rounded-lg transition-colors disabled:opacity-50"
                          title="Delete game"
                        >
                          {deleting === match.id ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-[#EF4444] border-t-transparent"></div>
                          ) : (
                            <TrashIcon className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-[#E5E7EB]">
              <p className="text-sm text-[#6B7280]">
                Showing {startIndex + 1}-{Math.min(endIndex, matches.length)} of {matches.length} matches
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="text-sm"
                >
                  Previous
                </Button>
                <span className="text-sm text-[#111827] font-medium">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="secondary"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="text-sm"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
