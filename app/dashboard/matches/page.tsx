"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";

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

  useEffect(() => {
    fetch("/api/matches")
      .then((res) => res.json())
      .then((data) => {
        setMatches(data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

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

  if (loading) {
    return (
      <div className="max-w-7xl">
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
    <div className="max-w-7xl">
      <PageHeader
        title="Matches"
        description="View and manage all matches"
        action={
          <Link href="/dashboard/games/register">
            <Button>Register Game</Button>
          </Link>
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
        <div className="space-y-4">
          {matches.map((match) => {
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
                    <div className="text-right">
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

