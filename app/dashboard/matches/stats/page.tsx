"use client";

import { useState } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

export default function AddStatsPage() {
  const [playerId, setPlayerId] = useState("");
  const [matchId, setMatchId] = useState("");
  const [goals, setGoals] = useState(0);
  const [assists, setAssists] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [rating, setRating] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function addStats() {
    setError("");
    setMessage("");

    if (!playerId || !matchId) {
      setError("Please enter Player ID and Match ID");
      return;
    }

    try {
      const res = await fetch("/api/matches/stats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          playerId,
          matchId,
          goals,
          assists,
          minutes,
          rating: rating ? parseFloat(rating) : null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to add stats");
        return;
      }

      setMessage("Stats added successfully!");
      setPlayerId("");
      setMatchId("");
      setGoals(0);
      setAssists(0);
      setMinutes(0);
      setRating("");
    } catch (error) {
      setError("An error occurred. Please try again.");
      console.error("Error:", error);
    }
  }

  return (
    <Card className="max-w-lg">
      <h1 className="text-xl font-bold mb-4">Add Player Stats</h1>

      <Input
        label="Player ID"
        placeholder="Enter player ID"
        value={playerId}
        onChange={(e) => setPlayerId(e.target.value)}
      />

      <Input
        label="Match ID"
        placeholder="Enter match ID"
        value={matchId}
        onChange={(e) => setMatchId(e.target.value)}
      />

      <Input
        label="Goals"
        type="number"
        placeholder="0"
        value={goals}
        onChange={(e) => setGoals(Number(e.target.value))}
      />

      <Input
        label="Assists"
        type="number"
        placeholder="0"
        value={assists}
        onChange={(e) => setAssists(Number(e.target.value))}
      />

      <Input
        label="Minutes"
        type="number"
        placeholder="0"
        value={minutes}
        onChange={(e) => setMinutes(Number(e.target.value))}
      />

      <Input
        label="Rating"
        type="number"
        step="0.1"
        placeholder="0.0"
        value={rating}
        onChange={(e) => setRating(e.target.value)}
      />

      <Button onClick={addStats}>Add Stats</Button>

      {message && <p className="mt-4 text-green-600">{message}</p>}
      {error && <p className="mt-4 text-red-600">{error}</p>}
    </Card>
  );
}

