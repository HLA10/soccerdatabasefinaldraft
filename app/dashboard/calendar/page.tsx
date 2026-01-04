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
    <div className="max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
          Match Calendar
        </h1>
        <p className="text-gray-600">View all matches organized by date</p>
      </div>

      {matches.length === 0 ? (
        <Card className="max-w-lg mx-auto text-center py-12">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center text-4xl mb-4 mx-auto">
            📅
          </div>
          <h3 className="text-xl font-bold mb-2 text-gray-900">No matches scheduled</h3>
          <p className="text-gray-600">Schedule your first match to see it here!</p>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedMatches)
            .sort(([dateA], [dateB]) => {
              return new Date(dateB).getTime() - new Date(dateA).getTime();
            })
            .map(([date, dateMatches]) => (
              <div key={date}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                  <h2 className="text-2xl font-bold text-gray-900 px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200">
                    {date}
                  </h2>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {dateMatches.map((match) => {
                    const totalGoals = match.stats.reduce(
                      (sum: number, stat: any) => sum + (stat.goals || 0),
                      0
                    );
                    const dateInfo = formatDate(match.date);

                    return (
                      <Card key={match.id} hover>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                              {match.team.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-lg text-gray-900">{match.team.name}</p>
                              <p className="text-sm text-gray-600">vs <span className="font-semibold">{match.opponent}</span></p>
                            </div>
                          </div>
                          {totalGoals > 0 && (
                            <div className="text-right">
                              <p className="text-3xl font-bold text-green-600">{totalGoals}</p>
                              <p className="text-xs text-gray-500 font-medium">goals</p>
                            </div>
                          )}
                        </div>
                        <div className="pt-4 border-t border-gray-100">
                          <p className="text-sm text-gray-600 flex items-center gap-2">
                            <span>📅</span>
                            {dateInfo.full}
                          </p>
                          <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                            <span>🕐</span>
                            {dateInfo.time}
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

