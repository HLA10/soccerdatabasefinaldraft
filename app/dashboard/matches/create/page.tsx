"use client";

import { useState } from "react";

export default function CreateMatchPage() {
  const [date, setDate] = useState("");
  const [opponent, setOpponent] = useState("");
  const [teamId, setTeamId] = useState("");
  const [message, setMessage] = useState("");

  async function createMatch() {
    const res = await fetch("/api/matches", {
      method: "POST",
      body: JSON.stringify({ date, opponent, teamId }),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error);
      return;
    }

    setMessage("Match created!");
  }

  return (
    <div>
      <h1>Create Match</h1>

      <input
        type="date"
        className="border p-2 block mb-2"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />

      <input
        placeholder="Opponent"
        className="border p-2 block mb-2"
        value={opponent}
        onChange={(e) => setOpponent(e.target.value)}
      />

      <input
        placeholder="Team ID"
        className="border p-2 block mb-2"
        value={teamId}
        onChange={(e) => setTeamId(e.target.value)}
      />

      <button
        onClick={createMatch}
        className="p-2 bg-blue-500 text-white"
      >
        Create Match
      </button>

      {message && <p className="mt-4">{message}</p>}
    </div>
  );
}

