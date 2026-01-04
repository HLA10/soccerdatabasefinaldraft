"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";

interface Match {
  id: string;
  date: string;
  opponent: string;
  team: {
    id: string;
    name: string;
  };
  stats: any[];
}

export default function CalendarPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/matches")
      .then((res) => res.json())
      .then((data) => {
        setMatches(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      full: date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      short: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      time: date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  // Group matches by date
  const groupedMatches = matches.reduce((acc, match) => {
    const dateKey = formatDate(match.date).short;
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(match);
    return acc;
  }, {} as Record<string, Match[]>);

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4">Match Calendar</h1>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Match Calendar</h1>

      {matches.length === 0 ? (
        <Card className="max-w-lg">
          <p className="text-gray-600">No matches scheduled yet.</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedMatches)
            .sort(([dateA], [dateB]) => {
              return new Date(dateB).getTime() - new Date(dateA).getTime();
            })
            .map(([date, dateMatches]) => (
              <div key={date}>
                <h2 className="text-xl font-semibold mb-3 text-gray-800 border-b pb-2">
                  {date}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {dateMatches.map((match) => {
                    const totalGoals = match.stats.reduce(
                      (sum: number, stat: any) => sum + (stat.goals || 0),
                      0
                    );
                    const dateInfo = formatDate(match.date);

                    return (
                      <Card key={match.id} className="hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                              {match.team.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-semibold">{match.team.name}</p>
                              <p className="text-sm text-gray-600">vs {match.opponent}</p>
                            </div>
                          </div>
                          {totalGoals > 0 && (
                            <div className="text-right">
                              <p className="text-2xl font-bold text-green-600">{totalGoals}</p>
                              <p className="text-xs text-gray-500">goals</p>
                            </div>
                          )}
                        </div>
                        <div className="pt-3 border-t">
                          <p className="text-sm text-gray-600">
                            {dateInfo.full} at {dateInfo.time}
                          </p>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

