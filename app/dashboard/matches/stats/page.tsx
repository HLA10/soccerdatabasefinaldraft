"use client";

import { useState } from "react";

export default function AddStatsPage() {
  const [playerId, setPlayerId] = useState("");
  const [matchId, setMatchId] = useState("");
  const [goals, setGoals] = useState(0);
  const [assists, setAssists] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [rating, setRating] = useState("");
  const [message, setMessage] = useState("");

  async function addStats() {
    const res = await fetch("/api/matches/stats", {
      method: "POST",
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
      setMessage(data.error);
      return;
    }

    setMessage("Stats added!");
  }

  return (
    <div>
      <h1>Add Player Stats</h1>

      <input
        placeholder="Player ID"
        className="border p-2 block mb-2"
        value={playerId}
        onChange={(e) => setPlayerId(e.target.value)}
      />

      <input
        placeholder="Match ID"
        className="border p-2 block mb-2"
        value={matchId}
        onChange={(e) => setMatchId(e.target.value)}
      />

      <input
        type="number"
        placeholder="Goals"
        className="border p-2 block mb-2"
        value={goals}
        onChange={(e) => setGoals(Number(e.target.value))}
      />

      <input
        type="number"
        placeholder="Assists"
        className="border p-2 block mb-2"
        value={assists}
        onChange={(e) => setAssists(Number(e.target.value))}
      />

      <input
        type="number"
        placeholder="Minutes"
        className="border p-2 block mb-2"
        value={minutes}
        onChange={(e) => setMinutes(Number(e.target.value))}
      />

      <input
        type="number"
        step="0.1"
        placeholder="Rating"
        className="border p-2 block mb-2"
        value={rating}
        onChange={(e) => setRating(e.target.value)}
      />

      <button
        onClick={addStats}
        className="p-2 bg-blue-500 text-white"
      >
        Add Stats
      </button>

      {message && <p className="mt-4">{message}</p>}
    </div>
  );
}

