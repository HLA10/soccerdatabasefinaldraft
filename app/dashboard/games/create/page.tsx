"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";

interface Team {
  id: string;
  name: string;
}

export default function CreateGamePage() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [homeTeamId, setHomeTeamId] = useState("");
  const [awayTeamId, setAwayTeamId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [venue, setVenue] = useState("");
  const [formationType, setFormationType] = useState("ELEVEN_V_ELEVEN");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/teams")
      .then((res) => res.json())
      .then((data) => setTeams(data || []))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    if (!homeTeamId || !awayTeamId || !date) {
      setError("Home team, away team, and date are required");
      setLoading(false);
      return;
    }

    if (homeTeamId === awayTeamId) {
      setError("Home and away teams must be different");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/games", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          homeTeamId,
          awayTeamId,
          date,
          time,
          venue,
          formationType,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create game");
        setLoading(false);
        return;
      }

      setMessage("Game created successfully!");
      setTimeout(() => {
        router.push(`/dashboard/games/${data.id}/squad`);
      }, 1000);
    } catch (err) {
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Create Game"
        description="Schedule a new match"
      />

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block mb-2 text-sm font-medium text-[#111827]">
              Home Team *
            </label>
            <select
              value={homeTeamId}
              onChange={(e) => setHomeTeamId(e.target.value)}
              className="w-full border border-[#E5E7EB] rounded-lg px-4 py-3 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:border-transparent transition-all duration-200 bg-white hover:border-[#D1D5DB]"
              required
            >
              <option value="">Select home team</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-[#111827]">
              Away Team *
            </label>
            <select
              value={awayTeamId}
              onChange={(e) => setAwayTeamId(e.target.value)}
              className="w-full border border-[#E5E7EB] rounded-lg px-4 py-3 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:border-transparent transition-all duration-200 bg-white hover:border-[#D1D5DB]"
              required
            >
              <option value="">Select away team</option>
              {teams
                .filter((team) => team.id !== homeTeamId)
                .map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 text-sm font-medium text-[#111827]">
                Date *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full border border-[#E5E7EB] rounded-lg px-4 py-3 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:border-transparent transition-all duration-200 bg-white hover:border-[#D1D5DB]"
              />
            </div>
            <div>
              <Input
                label="Time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Input
              label="Venue"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="Stadium or field name"
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-[#111827]">
              Match Type *
            </label>
            <select
              value={formationType}
              onChange={(e) => setFormationType(e.target.value)}
              className="w-full border border-[#E5E7EB] rounded-lg px-4 py-3 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:border-transparent transition-all duration-200 bg-white hover:border-[#D1D5DB]"
              required
            >
              <option value="ELEVEN_V_ELEVEN">11v11</option>
              <option value="NINE_V_NINE">9v9</option>
              <option value="SEVEN_V_SEVEN">7v7</option>
            </select>
          </div>

          {error && (
            <div className="p-4 bg-[#FEE2E2] border border-[#EF4444] rounded-lg">
              <p className="text-[#991B1B] font-medium text-sm">{error}</p>
            </div>
          )}

          {message && (
            <div className="p-4 bg-[#ECFDF5] border border-[#10B981] rounded-lg">
              <p className="text-[#065F46] font-medium text-sm">{message}</p>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Game"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

